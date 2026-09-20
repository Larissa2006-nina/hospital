import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';

// GET: Fetch blood requests
export async function GET(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const hospitalId = searchParams.get('hospitalId');
    const status = searchParams.get('status');

    let whereClause = {};
    if (patientId) whereClause.patientId = patientId;
    else if (hospitalId) whereClause.hospitalId = hospitalId;
    else if (auth) {
      if (auth.role === 'PATIENT' && auth.patientId) whereClause.patientId = auth.patientId;
      else if ((auth.role === 'HOSPITAL' || auth.role === 'LAB_TECH') && auth.hospitalId) {
        whereClause.hospitalId = auth.hospitalId;
      }
    }

    if (status) whereClause.status = status;

    const requests = await prisma.bloodRequest.findMany({
      where: whereClause,
      include: {
        patient: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        hospital: {
          include: { bloodBank: true },
        },
        transactions: {
          include: { payment: true },
        },
        bloodUnits: true,
      },
      orderBy: { requestDate: 'desc' },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('Blood requests GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch blood requests' }, { status: 500 });
  }
}

// POST: Patient submits a new blood request
export async function POST(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    const body = await request.json();
    const {
      hospitalId,
      bloodGroup,
      quantity = 1,
      urgency = 'MEDIUM',
      reason,
      notes,
    } = body;

    let patientId = body.patientId || auth?.patientId;

    if (!patientId || !hospitalId || !bloodGroup || !reason) {
      return NextResponse.json({ error: 'Missing required request fields: hospital, blood group, and clinical reason' }, { status: 400 });
    }

    const bloodRequest = await prisma.bloodRequest.create({
      data: {
        patientId,
        hospitalId,
        bloodGroup,
        quantity: parseInt(quantity, 10),
        urgency,
        reason,
        notes,
        status: 'PENDING',
      },
      include: {
        hospital: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    // Notify Patient
    await prisma.notification.create({
      data: {
        userId: bloodRequest.patient.user.id,
        title: 'Blood Request Submitted',
        message: `Your request for ${quantity} unit(s) of ${bloodGroup.replace('_', '+')} blood at ${bloodRequest.hospital.name} has been submitted for hospital clinical review.`,
        notificationType: 'REQUEST',
        linkUrl: '/patient/requests',
      },
    });

    // Notify Hospital
    if (bloodRequest.hospital?.user) {
      await prisma.notification.create({
        data: {
          userId: bloodRequest.hospital.user.id,
          title: `New ${urgency} Blood Request Received`,
          message: `Patient ${bloodRequest.patient.user.name} submitted a request for ${quantity} unit(s) of ${bloodGroup.replace('_', '+')}. Clinical Reason: ${reason}.`,
          notificationType: 'REQUEST',
          linkUrl: '/hospital/requests',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Blood request submitted successfully',
      request: bloodRequest,
    }, { status: 201 });
  } catch (error) {
    console.error('Blood request submission error:', error);
    return NextResponse.json({ error: 'Failed to submit blood request. ' + error.message }, { status: 500 });
  }
}

// PATCH: Hospital processes blood request (APPROVE, REJECT, FULFILL, CANCEL)
export async function PATCH(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    const body = await request.json();
    const { requestId, action, notes, unitIds } = body; // action: 'APPROVE', 'REJECT', 'CANCEL', 'FULFILL'

    if (!requestId || !action) {
      return NextResponse.json({ error: 'requestId and action are required' }, { status: 400 });
    }

    const bloodReq = await prisma.bloodRequest.findUnique({
      where: { requestId },
      include: {
        hospital: { include: { bloodBank: true } },
        patient: { include: { user: true } },
        transactions: true,
      },
    });

    if (!bloodReq) {
      return NextResponse.json({ error: 'Blood request not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      // 1. Verify Blood Bank stock for requested blood group
      const availableUnits = await prisma.bloodUnit.findMany({
        where: {
          bloodBankId: bloodReq.hospital.bloodBank.bloodBankId,
          bloodGroup: bloodReq.bloodGroup,
          status: 'AVAILABLE',
        },
        take: bloodReq.quantity,
      });

      if (availableUnits.length < bloodReq.quantity) {
        return NextResponse.json({
          error: `Insufficient stock in Blood Bank. Available: ${availableUnits.length} unit(s), Requested: ${bloodReq.quantity} unit(s). Consider initiating an Emergency Blood Request or transferring units.`,
          availableCount: availableUnits.length,
        }, { status: 409 });
      }

      // 2. Reserve blood units
      const unitsToReserve = unitIds && unitIds.length > 0
        ? unitIds
        : availableUnits.map(u => u.bloodUnitId);

      await prisma.bloodUnit.updateMany({
        where: { bloodUnitId: { in: unitsToReserve } },
        data: { status: 'RESERVED', requestId: bloodReq.requestId },
      });

      // 3. Create BloodTransaction (Financial Transaction for blood processing fee: $75 per unit)
      const amount = bloodReq.quantity * 75.00;
      const txnRef = `TXN-REQ-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

      const transaction = await prisma.bloodTransaction.create({
        data: {
          requestId: bloodReq.requestId,
          patientId: bloodReq.patientId,
          amount,
          currency: 'USD',
          transactionType: 'BLOOD_REQUEST_PAYMENT',
          transactionReference: txnRef,
          status: 'PENDING',
          description: `Blood component cross-match & processing fee for ${bloodReq.quantity} unit(s) of ${bloodReq.bloodGroup.replace('_', '+')}`,
        },
      });

      // 4. Update request status to APPROVED
      const updated = await prisma.bloodRequest.update({
        where: { requestId },
        data: {
          status: 'APPROVED',
          processedDate: new Date(),
          notes: notes || 'Blood units reserved. Awaiting patient processing payment.',
        },
      });

      // 5. Notify Patient to complete payment
      await prisma.notification.create({
        data: {
          userId: bloodReq.patient.user.id,
          title: 'Blood Request Approved! Payment Required',
          message: `Your request for ${bloodReq.quantity} unit(s) of ${bloodReq.bloodGroup.replace('_', '+')} blood was approved by ${bloodReq.hospital.name}. Units are reserved. Please complete the $${amount.toFixed(2)} processing payment.`,
          notificationType: 'REQUEST',
          linkUrl: '/patient/payments',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Blood request approved, units reserved, and financial transaction invoice created.',
        request: updated,
        transaction,
      });
    } else if (action === 'REJECT') {
      const updated = await prisma.bloodRequest.update({
        where: { requestId },
        data: {
          status: 'REJECTED',
          processedDate: new Date(),
          notes: notes || 'Request declined by hospital administration.',
        },
      });

      await prisma.notification.create({
        data: {
          userId: bloodReq.patient.user.id,
          title: 'Blood Request Update',
          message: `Your blood request at ${bloodReq.hospital.name} was rejected. Note: ${notes || 'Stock or clinical restriction.'}`,
          notificationType: 'REQUEST',
          linkUrl: '/patient/requests',
        },
      });

      return NextResponse.json({ success: true, message: 'Request rejected', request: updated });
    } else if (action === 'FULFILL') {
      // Mark as fulfilled and change reserved units to ISSUED
      await prisma.bloodUnit.updateMany({
        where: { requestId: bloodReq.requestId, status: 'RESERVED' },
        data: { status: 'ISSUED' },
      });

      const updated = await prisma.bloodRequest.update({
        where: { requestId },
        data: {
          status: 'FULFILLED',
          processedDate: new Date(),
          notes: notes || 'Blood units issued to clinical ward / patient.',
        },
      });

      return NextResponse.json({ success: true, message: 'Blood request fulfilled and units issued.', request: updated });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error) {
    console.error('Blood request process error:', error);
    return NextResponse.json({ error: 'Failed to process request: ' + error.message }, { status: 500 });
  }
}
