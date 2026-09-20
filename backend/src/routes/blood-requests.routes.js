const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /api/blood-requests
router.get('/', async (req, res) => {
  try {
    const auth = req.user;
    const { patientId, hospitalId, requestingHospitalId, requestType, status } = req.query;

    let whereClause = {};

    if (patientId) {
      whereClause.patientId = patientId;
    } else if (requestingHospitalId) {
      whereClause.requestingHospitalId = requestingHospitalId;
    } else if (hospitalId) {
      whereClause.hospitalId = hospitalId;
    } else if (auth) {
      if (auth.role === 'PATIENT' && auth.patientId) {
        whereClause.patientId = auth.patientId;
      } else if ((auth.role === 'HOSPITAL' || auth.role === 'LAB_TECH') && auth.hospitalId) {
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

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Blood requests GET error:', error);
    res.status(500).json({ error: 'Failed to fetch blood requests' });
  }
});

// POST /api/blood-requests
router.post('/', async (req, res) => {
  try {
    const auth = req.user;
    const {
      hospitalId,
      requestingHospitalId: reqHospIdInput,
      requestType = 'PATIENT_REQUEST',
      bloodGroup,
      quantity = 1,
      urgency = 'MEDIUM',
      reason,
      notes,
    } = req.body;

    if (requestType === 'HOSPITAL_TRANSFER') {
      const requestingHospitalId = reqHospIdInput || auth?.hospitalId;

      if (!hospitalId || !requestingHospitalId || !bloodGroup || !reason) {
        return res.status(400).json({
          error: 'Missing required transfer fields: Target hospital, requesting hospital, blood group, and reason',
        });
      }

      if (hospitalId === requestingHospitalId) {
        return res.status(400).json({ error: 'Target hospital cannot be the same as requesting hospital' });
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

      if (bloodRequest.hospital?.user) {
        await prisma.notification.create({
          data: {
            userId: bloodRequest.hospital.user.id,
            title: `Inter-Hospital ${urgency} Blood Transfer Request`,
            message: `${bloodRequest.requestingHospital?.name || 'A partner hospital'} requested ${quantity} unit(s) of ${bloodGroup.replace('_', '+')}. Reason: ${reason}.`,
            notificationType: 'REQUEST',
            linkUrl: '/hospital/requests',
          },
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Inter-hospital blood transfer request submitted successfully',
        request: bloodRequest,
      });
    }

    // Standard Patient Request
    let patientId = req.body.patientId || auth?.patientId;

    if (!patientId || !hospitalId || !bloodGroup || !reason) {
      return res.status(400).json({ error: 'Missing required request fields: hospital, blood group, and clinical reason' });
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

    return res.status(201).json({
      success: true,
      message: 'Blood request submitted successfully',
      request: bloodRequest,
    });
  } catch (error) {
    console.error('Blood request submission error:', error);
    res.status(500).json({ error: 'Failed to submit blood request: ' + error.message });
  }
});

// PATCH /api/blood-requests
router.patch('/', async (req, res) => {
  try {
    const auth = req.user;
    const { requestId, action, notes, unitIds } = req.body;

    if (!requestId || !action) {
      return res.status(400).json({ error: 'requestId and action are required' });
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
      return res.status(404).json({ error: 'Blood request not found' });
    }

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
        return res.status(409).json({
          error: `Insufficient stock in Blood Bank. Available: ${availableUnits.length} unit(s), Requested: ${bloodReq.quantity} unit(s).`,
          availableCount: availableUnits.length,
        });
      }

      const unitsToReserve = unitIds && unitIds.length > 0
        ? unitIds
        : availableUnits.map(u => u.bloodUnitId);

      await prisma.bloodUnit.updateMany({
        where: { bloodUnitId: { in: unitsToReserve } },
        data: { status: 'RESERVED', requestId: bloodReq.requestId },
      });

      let transaction = null;
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
          notes: notes || (bloodReq.requestType === 'HOSPITAL_TRANSFER' ? 'Transfer approved. Ready for fulfillment.' : 'Blood units reserved. Awaiting patient processing payment.'),
        },
      });

      return res.json({
        success: true,
        message: 'Blood request approved and units reserved.',
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

      return res.json({ success: true, message: 'Request rejected', request: updated });
    } else if (action === 'FULFILL') {
      if (bloodReq.requestType === 'HOSPITAL_TRANSFER' && bloodReq.requestingHospital?.bloodBank) {
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

        return res.json({
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

      return res.json({ success: true, message: 'Blood request fulfilled and units issued.', request: updated });
    }

    res.status(400).json({ error: 'Invalid action specified' });
  } catch (error) {
    console.error('Blood request process error:', error);
    res.status(500).json({ error: 'Failed to process request: ' + error.message });
  }
});

module.exports = router;
