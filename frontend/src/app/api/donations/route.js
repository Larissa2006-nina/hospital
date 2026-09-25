import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { evaluateAndAwardBadges } from '@/app/actions/badges';

// GET: List donations
export async function GET(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const donorId = searchParams.get('donorId');
    const hospitalId = searchParams.get('hospitalId');

    let whereClause = {};
    if (donorId) whereClause.donorId = donorId;
    else if (hospitalId) whereClause.hospitalId = hospitalId;
    else if (auth) {
      if (auth.role === 'DONOR' && auth.donorId) whereClause.donorId = auth.donorId;
      else if ((auth.role === 'HOSPITAL' || auth.role === 'LAB_TECH') && auth.hospitalId) {
        whereClause.hospitalId = auth.hospitalId;
      }
    }

    const donations = await prisma.bloodDonation.findMany({
      where: whereClause,
      include: {
        donor: {
          include: { user: { select: { name: true, email: true, phone: true } } },
        },
        hospital: true,
        appointment: true,
        bloodUnits: true,
      },
      orderBy: { donationDate: 'desc' },
    });

    return NextResponse.json({ success: true, donations });
  } catch (error) {
    console.error('Donations GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 });
  }
}

// POST: Record a new blood donation and generate BloodUnit for Lab Testing
export async function POST(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    const body = await request.json();
    const {
      donorId,
      hospitalId,
      appointmentId,
      bloodGroup,
      quantity = 450,
      donationType = 'WHOLE_BLOOD',
      componentType = 'WHOLE_BLOOD',
      screeningStatus = 'PASSED',
      notes,
    } = body;

    if (!donorId || !hospitalId || !bloodGroup) {
      return NextResponse.json({ error: 'Missing required donation fields: donorId, hospitalId, and bloodGroup' }, { status: 400 });
    }

    // 1. Get hospital's BloodBank
    const hospital = await prisma.hospital.findUnique({
      where: { hospitalId },
      include: { bloodBank: true, user: true },
    });

    if (!hospital || !hospital.bloodBank) {
      return NextResponse.json({ error: 'Hospital does not have an active Blood Bank associated.' }, { status: 400 });
    }

    // 2. Create BloodDonation record
    const donation = await prisma.bloodDonation.create({
      data: {
        donorId,
        hospitalId,
        appointmentId: appointmentId || null,
        donationDate: new Date(),
        bloodGroup,
        quantity: parseInt(quantity, 10),
        donationType,
        screeningStatus,
        donationStatus: 'COMPLETED',
        notes,
      },
      include: { donor: { include: { user: true } }, hospital: true },
    });

    // 3. Create BloodUnit in TESTING status (to be tested by Lab Technician)
    // Expiry date calculation: Whole blood ~42 days, Platelets ~5 days, Plasma ~365 days
    let expiryDays = 42;
    if (componentType === 'PLATELETS') expiryDays = 5;
    if (componentType === 'PLASMA') expiryDays = 365;

    const expiryDate = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const bloodUnit = await prisma.bloodUnit.create({
      data: {
        bloodBankId: hospital.bloodBank.bloodBankId,
        donationId: donation.donationId,
        bloodGroup,
        componentType,
        collectionDate: new Date(),
        expiryDate,
        quantity: parseInt(quantity, 10),
        status: 'TESTING',
        testStatus: 'PENDING',
        storageLocation: `Quarantine Rack Q-${Math.floor(Math.random() * 90 + 10)}`,
      },
    });

    // 4. Update Appointment status if linked
    if (appointmentId) {
      await prisma.appointment.update({
        where: { appointmentId },
        data: { status: 'COMPLETED' },
      });
    }

    // 5. Update Donor's lastDonationDate and eligibilityStatus (deferred for 90 days after donation)
    await prisma.donor.update({
      where: { donorId },
      data: {
        lastDonationDate: new Date(),
        eligibilityStatus: 'INELIGIBLE', // Will turn eligible after 90 days
      },
    });

    // 6. Notify Donor
    await prisma.notification.create({
      data: {
        userId: donation.donor.user.id,
        title: 'Donation Completed - You Saved Lives!',
        message: `Thank you ${donation.donor.user.name}! Your donation of ${quantity}ml (${bloodGroup.replace('_', '+')}) at ${hospital.name} was successfully completed. Unit is being routed for lab testing.`,
        notificationType: 'APPOINTMENT',
        linkUrl: '/donor/history',
      },
    });

    // 7. Notify Lab Technicians of this hospital
    const labTechs = await prisma.labTechnician.findMany({
      where: { hospitalId },
      include: { user: true },
    });

    for (const tech of labTechs) {
      await prisma.notification.create({
        data: {
          userId: tech.user.id,
          title: 'New Blood Unit Received for Testing',
          message: `Unit #${bloodUnit.bloodUnitId.slice(-6)} (${bloodGroup.replace('_', '+')} ${componentType}) is waiting in quarantine for infectious disease screening & ABO verification.`,
          notificationType: 'LAB',
          linkUrl: '/lab',
        },
      });
    }

    // 8. Automatically evaluate & award any newly unlocked donor gamification badges
    await evaluateAndAwardBadges(donorId);

    return NextResponse.json({
      success: true,
      message: 'Blood donation recorded and blood unit created for laboratory testing',
      donation,
      bloodUnit,
    }, { status: 201 });
  } catch (error) {
    console.error('Donation recording error:', error);
    return NextResponse.json({ error: 'Failed to record donation. ' + error.message }, { status: 500 });
  }
}
