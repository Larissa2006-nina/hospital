import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';

// GET: Fetch emergency requests
export async function GET(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get('hospitalId');
    const donorId = searchParams.get('donorId');
    const activeOnly = searchParams.get('active') === 'true';

    let whereClause = {};
    if (hospitalId) whereClause.hospitalId = hospitalId;
    if (activeOnly) {
      whereClause.status = {
        in: ['PENDING', 'CHECKING_STOCK', 'STOCK_AVAILABLE', 'LOW_STOCK', 'ALERT_SENT', 'DONORS_RESPONDING'],
      };
    }

    const emergencies = await prisma.emergencyDonation.findMany({
      where: whereClause,
      include: {
        hospital: {
          include: { bloodBank: true },
        },
        responses: {
          include: {
            donor: {
              include: {
                user: { select: { id: true, name: true, phone: true, email: true } },
              },
            },
          },
        },
      },
      orderBy: { requestDate: 'desc' },
    });

    return NextResponse.json({ success: true, emergencies });
  } catch (error) {
    console.error('Emergency requests GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch emergency requests' }, { status: 500 });
  }
}

// POST: Hospital triggers emergency request -> checks stock -> if low stock, finds eligible donors & broadcasts alert
export async function POST(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    const body = await request.json();
    const {
      bloodGroup,
      quantityNeeded,
      urgencyLevel = 'EMERGENCY',
      reason,
      requiredDate,
    } = body;

    let hospitalId = body.hospitalId || auth?.hospitalId;

    if (!hospitalId || !bloodGroup || !quantityNeeded || !reason) {
      return NextResponse.json({ error: 'Missing required emergency fields: hospital, bloodGroup, quantityNeeded, and reason' }, { status: 400 });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { hospitalId },
      include: { bloodBank: true, user: true },
    });

    if (!hospital || !hospital.bloodBank) {
      return NextResponse.json({ error: 'Hospital does not have an active Blood Bank' }, { status: 400 });
    }

    const neededCount = parseInt(quantityNeeded, 10);
    const reqDate = requiredDate ? new Date(requiredDate) : new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours default

    // 1. Check Blood Bank stock
    const availableUnits = await prisma.bloodUnit.count({
      where: {
        bloodBankId: hospital.bloodBank.bloodBankId,
        bloodGroup,
        status: 'AVAILABLE',
      },
    });

    const isStockSufficient = availableUnits >= neededCount;
    const initialStatus = isStockSufficient ? 'STOCK_AVAILABLE' : 'ALERT_SENT';

    // 2. Create EmergencyDonation entity
    const emergency = await prisma.emergencyDonation.create({
      data: {
        hospitalId,
        bloodGroup,
        quantityNeeded: neededCount,
        urgencyLevel,
        reason,
        requestDate: new Date(),
        requiredDate: reqDate,
        status: initialStatus,
      },
      include: { hospital: true },
    });

    let notifiedDonorsCount = 0;

    // 3. If insufficient stock, find ELIGIBLE DONORS & send notifications
    if (!isStockSufficient) {
      // 90 days waiting period check
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      // Compatible blood groups (Exact match + Universal O- donors)
      const compatibleGroups = [bloodGroup];
      if (bloodGroup !== 'O_NEG') {
        compatibleGroups.push('O_NEG'); // O- is universal red cell donor
      }

      const eligibleDonors = await prisma.donor.findMany({
        where: {
          bloodGroup: { in: compatibleGroups },
          eligibilityStatus: 'ELIGIBLE',
          OR: [
            { lastDonationDate: null },
            { lastDonationDate: { lte: ninetyDaysAgo } },
          ],
        },
        include: { user: true },
      });

      // Send emergency notifications to eligible donors
      for (const donor of eligibleDonors) {
        await prisma.notification.create({
          data: {
            userId: donor.user.id,
            title: `🚨 EMERGENCY BLOOD ALERT: ${bloodGroup.replace('_', '+')} Needed Urgently`,
            message: `${hospital.name} has issued an emergency blood alert for ${neededCount} units of ${bloodGroup.replace('_', '+')}. Clinical Reason: ${reason}. Please respond if available to donate!`,
            notificationType: 'EMERGENCY',
            linkUrl: '/donor/emergency',
          },
        });
        notifiedDonorsCount++;
      }
    }

    return NextResponse.json({
      success: true,
      emergency,
      availableStock: availableUnits,
      stockSufficient: isStockSufficient,
      notifiedDonorsCount,
      message: isStockSufficient
        ? `Stock check passed: ${availableUnits} units available in Blood Bank.`
        : `Stock low (${availableUnits} units available). Emergency broadcast dispatched to ${notifiedDonorsCount} eligible registered donors.`,
    }, { status: 201 });
  } catch (error) {
    console.error('Emergency request error:', error);
    return NextResponse.json({ error: 'Failed to create emergency request. ' + error.message }, { status: 500 });
  }
}

// PATCH: Donor responds to emergency request or Hospital updates status
export async function PATCH(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    const body = await request.json();
    const { emergencyId, donorId: inputDonorId, status, notes } = body;

    let donorId = inputDonorId || auth?.donorId;

    if (!emergencyId) {
      return NextResponse.json({ error: 'emergencyId is required' }, { status: 400 });
    }

    // If a donor is responding
    if (donorId && (status === 'ACCEPTED' || status === 'DECLINED' || status === 'RESPONDED')) {
      const response = await prisma.emergencyDonorResponse.upsert({
        where: {
          emergencyId_donorId: {
            emergencyId,
            donorId,
          },
        },
        update: { status, notes, createdAt: new Date() },
        create: {
          emergencyId,
          donorId,
          status,
          notes,
        },
        include: {
          donor: { include: { user: true } },
          emergency: { include: { hospital: { include: { user: true } } } },
        },
      });

      // Update emergency status to DONORS_RESPONDING if at least 1 accepted
      if (status === 'ACCEPTED') {
        await prisma.emergencyDonation.update({
          where: { emergencyId },
          data: { status: 'DONORS_RESPONDING' },
        });

        // Notify Hospital
        if (response.emergency.hospital?.user) {
          await prisma.notification.create({
            data: {
              userId: response.emergency.hospital.user.id,
              title: '🚑 Donor Responded to Emergency Alert',
              message: `Donor ${response.donor.user.name} (${response.donor.bloodGroup.replace('_', '+')}) accepted the emergency blood alert!`,
              notificationType: 'EMERGENCY',
              linkUrl: '/hospital/emergency',
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Emergency response recorded: ${status}`,
        response,
      });
    }

    // If hospital updates emergency overall status (FULFILLED / CANCELLED)
    if (status) {
      const updated = await prisma.emergencyDonation.update({
        where: { emergencyId },
        data: { status },
      });
      return NextResponse.json({ success: true, emergency: updated });
    }

    return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
  } catch (error) {
    console.error('Emergency PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update emergency: ' + error.message }, { status: 500 });
  }
}
