import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';

// GET: Fetch generated reports or execute dynamic report query
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'BLOOD_BANK';
    const hospitalId = searchParams.get('hospitalId');
    const bloodGroup = searchParams.get('bloodGroup');
    const status = searchParams.get('status');
    const urgency = searchParams.get('urgency');

    let reportData = {};

    if (type === 'BLOOD_BANK') {
      const where = {};
      if (hospitalId) where.bloodBank = { hospitalId };
      if (bloodGroup) where.bloodGroup = bloodGroup;
      if (status) where.status = status;

      const units = await prisma.bloodUnit.findMany({
        where,
        include: { bloodBank: { include: { hospital: true } } },
      });

      const totalQuantityMl = units.reduce((acc, u) => acc + u.quantity, 0);
      const availableUnits = units.filter(u => u.status === 'AVAILABLE').length;
      const testingUnits = units.filter(u => u.status === 'TESTING').length;
      const reservedUnits = units.filter(u => u.status === 'RESERVED').length;
      const issuedUnits = units.filter(u => u.status === 'ISSUED').length;
      const discardedUnits = units.filter(u => u.status === 'DISCARDED').length;

      reportData = {
        title: 'Blood Bank Inventory & Storage Report',
        totalUnits: units.length,
        totalQuantityMl,
        availableUnits,
        testingUnits,
        reservedUnits,
        issuedUnits,
        discardedUnits,
        details: units.slice(0, 50),
      };
    } else if (type === 'DONATION') {
      const where = {};
      if (hospitalId) where.hospitalId = hospitalId;
      if (bloodGroup) where.bloodGroup = bloodGroup;

      const donations = await prisma.bloodDonation.findMany({
        where,
        include: {
          donor: { include: { user: true } },
          hospital: true,
        },
        orderBy: { donationDate: 'desc' },
      });

      reportData = {
        title: 'Blood Donations & Donor Collection Summary',
        totalDonations: donations.length,
        totalVolumeMl: donations.reduce((acc, d) => acc + d.quantity, 0),
        passedScreeningCount: donations.filter(d => d.screeningStatus === 'PASSED').length,
        details: donations,
      };
    } else if (type === 'BLOOD_REQUEST') {
      const where = {};
      if (hospitalId) where.hospitalId = hospitalId;
      if (bloodGroup) where.bloodGroup = bloodGroup;
      if (status) where.status = status;
      if (urgency) where.urgency = urgency;

      const requests = await prisma.bloodRequest.findMany({
        where,
        include: {
          patient: { include: { user: true } },
          hospital: true,
          transactions: true,
        },
        orderBy: { requestDate: 'desc' },
      });

      reportData = {
        title: 'Clinical Blood Requests & Hospital Allocation Report',
        totalRequests: requests.length,
        fulfilledCount: requests.filter(r => r.status === 'FULFILLED').length,
        approvedCount: requests.filter(r => r.status === 'APPROVED').length,
        pendingCount: requests.filter(r => r.status === 'PENDING').length,
        rejectedCount: requests.filter(r => r.status === 'REJECTED').length,
        details: requests,
      };
    } else if (type === 'FINANCIAL' || type === 'PAYMENT') {
      const where = {};
      if (hospitalId) where.bloodRequest = { hospitalId };

      const txns = await prisma.bloodTransaction.findMany({
        where,
        include: {
          payment: true,
          patient: { include: { user: true } },
          bloodRequest: { include: { hospital: true } },
        },
        orderBy: { transactionDate: 'desc' },
      });

      const totalRevenue = txns.filter(t => t.status === 'SUCCESS').reduce((acc, t) => acc + t.amount, 0);

      reportData = {
        title: 'Financial Transactions & Patient Payments Audit',
        totalTransactions: txns.length,
        successfulCount: txns.filter(t => t.status === 'SUCCESS').length,
        pendingCount: txns.filter(t => t.status === 'PENDING').length,
        totalRevenueUSD: totalRevenue,
        details: txns,
      };
    } else if (type === 'EMERGENCY') {
      const where = {};
      if (hospitalId) where.hospitalId = hospitalId;
      if (bloodGroup) where.bloodGroup = bloodGroup;

      const emergencies = await prisma.emergencyDonation.findMany({
        where,
        include: {
          hospital: true,
          responses: { include: { donor: { include: { user: true } } } },
        },
        orderBy: { requestDate: 'desc' },
      });

      const totalResponses = emergencies.reduce((acc, e) => acc + e.responses.length, 0);

      reportData = {
        title: 'Emergency Blood Requests & Donor Response Report',
        totalEmergencies: emergencies.length,
        totalDonorResponses: totalResponses,
        fulfilledCount: emergencies.filter(e => e.status === 'FULFILLED').length,
        activeAlertsCount: emergencies.filter(e => e.status === 'ALERT_SENT' || e.status === 'DONORS_RESPONDING').length,
        details: emergencies,
      };
    } else if (type === 'LAB_TESTING') {
      const units = await prisma.bloodUnit.findMany({
        where: { testStatus: { not: 'PENDING' } },
        include: {
          bloodBank: { include: { hospital: true } },
          labTechnician: { include: { user: true } },
        },
      });

      reportData = {
        title: 'Laboratory Testing & Infectious Screening Compliance Report',
        totalScreened: units.length,
        passedRate: units.length ? ((units.filter(u => u.testStatus === 'PASSED').length / units.length) * 100).toFixed(1) + '%' : '100%',
        pathogenDetectedCount: units.filter(u => u.testStatus === 'FAILED').length,
        details: units,
      };
    } else {
      // Default: Registered Donors Report
      const donors = await prisma.donor.findMany({
        include: { user: true, bloodDonations: true },
      });

      reportData = {
        title: 'Registered Donors & Demographic Eligibility Report',
        totalDonors: donors.length,
        eligibleDonors: donors.filter(d => d.eligibilityStatus === 'ELIGIBLE').length,
        ineligibleDonors: donors.filter(d => d.eligibilityStatus !== 'ELIGIBLE').length,
        details: donors,
      };
    }

    return NextResponse.json({
      success: true,
      reportType: type,
      generatedAt: new Date().toISOString(),
      report: reportData,
    });
  } catch (error) {
    console.error('Reports generation error:', error);
    return NextResponse.json({ error: 'Failed to generate report: ' + error.message }, { status: 500 });
  }
}
