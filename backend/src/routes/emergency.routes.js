const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /api/emergency
router.get('/', async (req, res) => {
  try {
    const auth = req.user;
    const { hospitalId, status } = req.query;

    let whereClause = {};
    if (hospitalId) whereClause.hospitalId = hospitalId;
    else if (auth && auth.role === 'HOSPITAL' && auth.hospitalId) whereClause.hospitalId = auth.hospitalId;
    if (status) whereClause.status = status;

    const emergencies = await prisma.emergencyDonation.findMany({
      where: whereClause,
      include: {
        hospital: { include: { bloodBank: true } },
        responses: { include: { donor: { include: { user: { select: { name: true, phone: true } } } } } },
      },
      orderBy: { requestDate: 'desc' },
    });

    res.json({ success: true, emergencies });
  } catch (error) {
    console.error('Emergency GET error:', error);
    res.status(500).json({ error: 'Failed to fetch emergency alerts' });
  }
});

// POST /api/emergency
router.post('/', async (req, res) => {
  try {
    const auth = req.user;
    const { hospitalId: hospInput, bloodGroup, quantityNeeded, reason, requiredDate } = req.body;
    const hospitalId = hospInput || auth?.hospitalId;

    if (!hospitalId || !bloodGroup || !quantityNeeded || !reason) {
      return res.status(400).json({ error: 'Missing required emergency alert fields' });
    }

    const emergency = await prisma.emergencyDonation.create({
      data: {
        hospitalId,
        bloodGroup,
        quantityNeeded: parseInt(quantityNeeded, 10),
        reason,
        requiredDate: requiredDate ? new Date(requiredDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'ALERT_SENT',
      },
      include: { hospital: true },
    });

    // Notify all eligible donors matching bloodGroup
    const eligibleDonors = await prisma.donor.findMany({
      where: { bloodGroup, eligibilityStatus: 'ELIGIBLE' },
      include: { user: true },
    });

    for (const d of eligibleDonors) {
      if (d.user) {
        await prisma.notification.create({
          data: {
            userId: d.user.id,
            title: `URGENT: ${bloodGroup.replace('_', '+')} Blood Emergency!`,
            message: `Hospital ${emergency.hospital.name} requires ${quantityNeeded} unit(s) of ${bloodGroup.replace('_', '+')} blood immediately. Reason: ${reason}.`,
            notificationType: 'EMERGENCY',
            linkUrl: '/donor/emergency',
          },
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Emergency broadcast initiated. ${eligibleDonors.length} compatible donor(s) notified.`,
      emergency,
      notifiedCount: eligibleDonors.length,
    });
  } catch (error) {
    console.error('Emergency POST error:', error);
    res.status(500).json({ error: 'Failed to initiate emergency broadcast: ' + error.message });
  }
});

module.exports = router;
