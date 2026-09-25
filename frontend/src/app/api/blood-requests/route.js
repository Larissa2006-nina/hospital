import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';

// GET: Fetch blood requests (Inpatient & Inter-Hospital Transfers)
export async function GET(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const hospitalId = searchParams.get('hospitalId');
    const requestingHospitalId = searchParams.get('requestingHospitalId');
    const requestType = searchParams.get('requestType');
    const status = searchParams.get('status');

    let whereClause = {};
    if (patientId) whereClause.patientId = patientId;
    else if (requestingHospitalId) whereClause.requestingHospitalId = requestingHospitalId;
    else if (hospitalId) whereClause.hospitalId = hospitalId;
    else if (auth) {
      if (auth.role === 'PATIENT' && auth.patientId) whereClause.patientId = auth.patientId;
      else if ((auth.role === 'HOSPITAL' || auth.role === 'LAB_TECH') && auth.hospitalId) {
        whereClause.OR = [
          { hospitalId: auth.hospitalId },
          { requestingHospitalId: auth.hospitalId },
        ];
      }
    }

    if (status) whereClause.status = status;
    if (requestType) whereClause.requestType = requestType;

    const requests = await prisma.bloodRequest.findMany({
      where: whereClause,
      include: {
        patient: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        hospital: {
          include: { user: true, bloodBank: true },
        },
        requestingHospital: {
          include: { user: true, bloodBank: true },
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

// POST: Submit a new blood request (Inpatient or Inter-Hospital Blood Transfer)
export async function POST(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    const body = await request.json();
    const {
      hospitalId, // Fulfilling target hospital ID
      requestingHospitalId: reqHospInput,
      requestType = 'PATIENT_REQUEST', // 'PATIENT_REQUEST' or 'HOSPITAL_TRANSFER'
      bloodGroup,
      quantity = 1,
      urgency = 'MEDIUM',
      reason,
      notes,
    } = body;

    // -------------------------------------------------------------
    // INTER-HOSPITAL BLOOD TRANSFER REQUEST
    // -------------------------------------------------------------
    if (requestType === 'HOSPITAL_TRANSFER') {
      const requestingHospitalId = reqHospInput || auth?.hospitalId;

      if (!hospitalId || !requestingHospitalId || !bloodGroup || !reason) {
        return NextResponse.json({
          error: 'Missing required transfer fields: Target hospital, requesting hospital, blood group, and reason',
        }, { status: 400 });
      }

      if (hospitalId === requestingHospitalId) {
        return NextResponse.json({ error: 'Target hospital cannot be the same as requesting hospital' }, { status: 400 });
      }

      const bloodRequest = await prisma.bloodRequest.create({
        data: {
          hospitalId,
          requestingHospitalId,
          requestType: 'HOSPITAL_TRANSFER',
          bloodGroup,
          quantity: parseInt(quantity, 10),
          urgency,
          reason,
          notes,
          status: 'PENDING',
        },
        include: {
          hospital: { include: { user: true } },
          requestingHospital: { include: { user: true } },
        },
      });

      // Notify Target Fulfilling Hospital
      if (bloodRequest.hospital?.user) {
        await prisma.notification.create({
          data: {
            userId: bloodRequest.hospital.user.id,
            title: `🏥 Inter-Hospital ${urgency} Blood Request Received`,
            message: `${bloodRequest.requestingHospital?.name || 'A partner hospital'} requested ${quantity} unit(s) of ${bloodGroup.replace('_', '+')}. Clinical Reason: ${reason}.`,
            notificationType: 'REQUEST',
            linkUrl: '/hospital/requests',
          },
        });
      }

      // Notify Requesting Hospital
      if (bloodRequest.requestingHospital?.user) {
        await prisma.notification.create({
          data: {
            userId: bloodRequest.requestingHospital.user.id,
            title: 'Inter-Hospital Transfer Request Submitted',
            message: `Your request for ${quantity} unit(s) of ${bloodGroup.replace('_', '+')} from ${bloodRequest.hospital.name} has been submitted.`,
            notificationType: 'REQUEST',
            linkUrl: '/hospital/requests',
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Inter-hospital blood transfer request submitted successfully',
        request: bloodRequest,
      }, { status: 201 });
    }

    // -------------------------------------------------------------
    // STANDARD PATIENT INPATIENT REQUEST
    // -------------------------------------------------------------
    let patientId = body.patientId || auth?.patientId;

    if (!patientId || !hospitalId || !bloodGroup || !reason) {
      return NextResponse.json({ error: 'Missing required request fields: hospital, blood group, and clinical reason' }, { status: 400 });
    }

    const bloodRequest = await prisma.bloodRequest.create({
      data: {
        patientId,
        hospitalId,
        requestType: 'PATIENT_REQUEST',
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

    if (bloodRequest.patient?.user) {
      await prisma.notification.create({
        data: {
          userId: bloodRequest.patient.user.id,
          title: 'Blood Request Submitted',
          message: `Your request for ${quantity} unit(s) of ${bloodGroup.replace('_', '+')} blood at ${bloodRequest.hospital.name} has been submitted for hospital clinical review.`,
          notificationType: 'REQUEST',
          linkUrl: '/patient/requests',
        },
      });
    }

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

// PATCH: Process blood request (APPROVE, REJECT, FULFILL, CANCEL)
export async function PATCH(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    const body = await request.json();
    const { requestId, action, notes, unitIds } = body;

    if (!requestId || !action) {
      return NextResponse.json({ error: 'requestId and action are required' }, { status: 400 });
    }

    const bloodReq = await prisma.bloodRequest.findUnique({
      where: { requestId },
      include: {
        hospital: { include: { bloodBank: true, user: true } },
        requestingHospital: { include: { bloodBank: true, user: true } },
        patient: { include: { user: true } },
        transactions: true,
      },
    });

    if (!bloodReq) {
      return NextResponse.json({ error: 'Blood request not found' }, { status: 404 });
    }

    // 1. APPROVE ACTION
    if (action === 'APPROVE') {
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
          error: `Insufficient stock in Blood Bank. Available: ${availableUnits.length} unit(s), Requested: ${bloodReq.quantity} unit(s).`,
          availableCount: availableUnits.length,
        }, { status: 409 });
      }

      const unitsToReserve = unitIds && unitIds.length > 0
        ? unitIds
        : availableUnits.map(u => u.bloodUnitId);

      await prisma.bloodUnit.updateMany({
        where: { bloodUnitId: { in: unitsToReserve } },
        data: { status: 'RESERVED', requestId: bloodReq.requestId },
      });

      let transaction = null;
      // Only generate invoice for Patient Requests
      if (bloodReq.requestType === 'PATIENT_REQUEST' && bloodReq.patientId) {
        const amount = bloodReq.quantity * 75.00;
        const txnRef = `TXN-REQ-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

        transaction = await prisma.bloodTransaction.create({
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
      }

      const updated = await prisma.bloodRequest.update({
        where: { requestId },
        data: {
          status: 'APPROVED',
          processedDate: new Date(),
          notes: notes || (bloodReq.requestType === 'HOSPITAL_TRANSFER' ? 'Inter-hospital transfer approved. Units reserved.' : 'Blood units reserved. Awaiting patient payment.'),
        },
      });

      // Notify Requesting Hospital or Patient
      if (bloodReq.requestType === 'HOSPITAL_TRANSFER' && bloodReq.requestingHospital?.user) {
        await prisma.notification.create({
          data: {
            userId: bloodReq.requestingHospital.user.id,
            title: 'Inter-Hospital Transfer Approved! ✅',
            message: `${bloodReq.hospital.name} approved your request for ${bloodReq.quantity} unit(s) of ${bloodReq.bloodGroup.replace('_', '+')}. Units are reserved for transfer.`,
            notificationType: 'REQUEST',
            linkUrl: '/hospital/requests',
          },
        });
      } else if (bloodReq.patient?.user) {
        await prisma.notification.create({
          data: {
            userId: bloodReq.patient.user.id,
            title: 'Blood Request Approved!',
            message: `Your request for ${bloodReq.quantity} unit(s) of ${bloodReq.bloodGroup.replace('_', '+')} blood was approved by ${bloodReq.hospital.name}. Please complete payment to issue units.`,
            notificationType: 'REQUEST',
            linkUrl: '/patient/payments',
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: bloodReq.requestType === 'HOSPITAL_TRANSFER'
          ? 'Inter-hospital blood transfer approved and units reserved.'
          : 'Blood request approved, units reserved, and transaction invoice generated.',
        request: updated,
        transaction,
      });

    // 2. REJECT ACTION
    } else if (action === 'REJECT') {
      const updated = await prisma.bloodRequest.update({
        where: { requestId },
        data: {
          status: 'REJECTED',
          processedDate: new Date(),
          notes: notes || 'Request declined by hospital administration.',
        },
      });

      if (bloodReq.requestType === 'HOSPITAL_TRANSFER' && bloodReq.requestingHospital?.user) {
        await prisma.notification.create({
          data: {
            userId: bloodReq.requestingHospital.user.id,
            title: 'Inter-Hospital Transfer Request Rejected',
            message: `Your transfer request at ${bloodReq.hospital.name} was declined. Reason: ${notes || 'Stock limitation.'}`,
            notificationType: 'REQUEST',
            linkUrl: '/hospital/requests',
          },
        });
      }

      return NextResponse.json({ success: true, message: 'Request rejected', request: updated });

    // 3. FULFILL ACTION
    } else if (action === 'FULFILL') {
      if (bloodReq.requestType === 'HOSPITAL_TRANSFER' && bloodReq.requestingHospital?.bloodBank) {
        // Transfer stock directly to requesting hospital's Blood Bank
        await prisma.bloodUnit.updateMany({
          where: { requestId: bloodReq.requestId, status: 'RESERVED' },
          data: {
            bloodBankId: bloodReq.requestingHospital.bloodBank.bloodBankId,
            status: 'AVAILABLE',
            requestId: null,
          },
        });

        const updated = await prisma.bloodRequest.update({
          where: { requestId },
          data: {
            status: 'FULFILLED',
            processedDate: new Date(),
            notes: notes || `Transferred ${bloodReq.quantity} blood unit(s) to ${bloodReq.requestingHospital.name} Blood Bank.`,
          },
        });

        if (bloodReq.requestingHospital.user) {
          await prisma.notification.create({
            data: {
              userId: bloodReq.requestingHospital.user.id,
              title: '🚚 Inter-Hospital Stock Transfer Received!',
              message: `${bloodReq.quantity} unit(s) of ${bloodReq.bloodGroup.replace('_', '+')} from ${bloodReq.hospital.name} have been added to your Blood Bank inventory.`,
              notificationType: 'STOCK',
              linkUrl: '/hospital/blood-bank',
            },
          });
        }

        return NextResponse.json({
          success: true,
          message: `Blood transfer fulfilled! ${bloodReq.quantity} unit(s) added to ${bloodReq.requestingHospital.name}'s inventory.`,
          request: updated,
        });
      }

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
