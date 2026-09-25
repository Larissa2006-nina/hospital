import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { evaluateAndAwardBadges } from '@/app/actions/badges';

// GET: Fetch testing queue and completed tests
export async function GET(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get('hospitalId') || auth?.hospitalId;
    const status = searchParams.get('status'); // TESTING, APPROVED, DISCARDED

    let whereClause = {};
    if (hospitalId) {
      whereClause.bloodBank = { hospitalId };
    }
    if (status) {
      whereClause.status = status;
    }

    const units = await prisma.bloodUnit.findMany({
      where: whereClause,
      include: {
        bloodBank: { include: { hospital: true } },
        labTechnician: { include: { user: true } },
        bloodDonation: {
          include: {
            donor: { include: { user: true } },
          },
        },
      },
      orderBy: { collectionDate: 'desc' },
    });

    const pendingCount = units.filter(u => u.status === 'TESTING').length;
    const approvedCount = units.filter(u => u.status === 'APPROVED' || u.status === 'AVAILABLE').length;
    const discardedCount = units.filter(u => u.status === 'DISCARDED').length;

    return NextResponse.json({
      success: true,
      pendingCount,
      approvedCount,
      discardedCount,
      units,
    });
  } catch (error) {
    console.error('Lab tests fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch lab tests queue' }, { status: 500 });
  }
}

// POST: Record laboratory screening results and approve or reject blood unit
export async function POST(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    const body = await request.json();
    const {
      bloodUnitId,
      hivTest = 'NEGATIVE',
      hbvTest = 'NEGATIVE',
      hcvTest = 'NEGATIVE',
      syphilisTest = 'NEGATIVE',
      verifiedGroup,
      storageLocation,
      testNotes,
      decision, // "APPROVE" or "REJECT"
    } = body;

    let labTechId = body.labTechId || auth?.labTechId;

    if (!bloodUnitId) {
      return NextResponse.json({ error: 'bloodUnitId is required' }, { status: 400 });
    }

    // Find the blood unit
    const unit = await prisma.bloodUnit.findUnique({
      where: { bloodUnitId },
      include: {
        bloodBank: { include: { hospital: { include: { user: true } } } },
        bloodDonation: { include: { donor: { include: { user: true } } } },
      },
    });

    if (!unit) {
      return NextResponse.json({ error: 'Blood unit not found' }, { status: 404 });
    }

    const allNegative =
      hivTest === 'NEGATIVE' &&
      hbvTest === 'NEGATIVE' &&
      hcvTest === 'NEGATIVE' &&
      syphilisTest === 'NEGATIVE';

    const isApproved = decision === 'APPROVE' && allNegative;

    const newUnitStatus = isApproved ? 'AVAILABLE' : 'DISCARDED';
    const newTestStatus = isApproved ? 'PASSED' : 'FAILED';
    const assignedLocation = isApproved
      ? (storageLocation || `Vault Block ${verifiedGroup || unit.bloodGroup}-01`)
      : 'Hazardous Waste Quarantine';

    const updatedUnit = await prisma.bloodUnit.update({
      where: { bloodUnitId },
      data: {
        status: newUnitStatus,
        testStatus: newTestStatus,
        hivTest,
        hbvTest,
        hcvTest,
        syphilisTest,
        verifiedGroup: verifiedGroup || unit.bloodGroup,
        storageLocation: assignedLocation,
        testNotes,
        testedAt: new Date(),
        labTechId: labTechId || null,
      },
      include: {
        bloodBank: { include: { hospital: true } },
        labTechnician: { include: { user: true } },
      },
    });

    // Notify Hospital Administration
    if (unit.bloodBank?.hospital?.user) {
      await prisma.notification.create({
        data: {
          userId: unit.bloodBank.hospital.user.id,
          title: isApproved ? '✅ Blood Unit Tested & Approved for Blood Bank' : '⚠️ Blood Unit Rejected by Lab',
          message: isApproved
            ? `Unit #${unit.bloodUnitId.slice(-6)} (${(verifiedGroup || unit.bloodGroup).replace('_', '+')}) passed all pathogen screenings and is now AVAILABLE in ${unit.bloodBank.name} at ${assignedLocation}.`
            : `Unit #${unit.bloodUnitId.slice(-6)} failed laboratory screening and has been marked as DISCARDED.`,
          notificationType: 'LAB',
          linkUrl: '/hospital/blood-bank',
        },
      });
    }

    // Evaluate badges if donation is associated
    if (unit.bloodDonation?.donorId) {
      await evaluateAndAwardBadges(unit.bloodDonation.donorId);
    }

    return NextResponse.json({
      success: true,
      message: isApproved
        ? 'Blood unit successfully tested, verified, and placed into Blood Bank stock!'
        : 'Blood unit screening recorded. Unit marked as DISCARDED.',
      unit: updatedUnit,
    });
  } catch (error) {
    console.error('Lab test submission error:', error);
    return NextResponse.json({ error: 'Failed to record test results. ' + error.message }, { status: 500 });
  }
}
