const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /api/donations
router.get('/', async (req, res) => {
  try {
    const auth = req.user;
    const { donorId, hospitalId } = req.query;

    let whereClause = {};
    if (donorId) whereClause.donorId = donorId;
    else if (hospitalId) whereClause.hospitalId = hospitalId;
    else if (auth) {
      if (auth.role === 'DONOR' && auth.donorId) whereClause.donorId = auth.donorId;
      else if ((auth.role === 'HOSPITAL' || auth.role === 'LAB_TECH') && auth.hospitalId) whereClause.hospitalId = auth.hospitalId;
    }

    const donations = await prisma.bloodDonation.findMany({
      where: whereClause,
      include: {
        donor: { include: { user: { select: { name: true, email: true, phone: true } } } },
        hospital: { select: { name: true, city: true } },
        bloodUnits: true,
      },
      orderBy: { donationDate: 'desc' },
    });

    res.json({ success: true, count: donations.length, donations });
  } catch (error) {
    console.error('Donations GET error:', error);
    res.status(500).json({ error: 'Failed to fetch donation records' });
  }
});

// POST /api/donations
router.post('/', async (req, res) => {
  try {
    const auth = req.user;
    const { donorId, hospitalId: hospInput, bloodGroup, quantity = 450, donationType = 'WHOLE_BLOOD', appointmentId, notes } = req.body;
    const hospitalId = hospInput || auth?.hospitalId;

    if (!donorId || !hospitalId || !bloodGroup) {
      return res.status(400).json({ error: 'donorId, hospitalId, and bloodGroup are required' });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { hospitalId },
      include: { bloodBank: true },
    });

    if (!hospital || !hospital.bloodBank) {
      return res.status(404).json({ error: 'Hospital Blood Bank not found' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const donation = await tx.bloodDonation.create({
        data: {
          donorId,
          hospitalId,
          appointmentId,
          bloodGroup,
          quantity: parseInt(quantity, 10),
          donationType,
          screeningStatus: 'PASSED',
          donationStatus: 'COMPLETED',
          notes,
        },
      });

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 42); // 42-day shelf life

      const bloodUnit = await tx.bloodUnit.create({
        data: {
          bloodBankId: hospital.bloodBank.bloodBankId,
          donationId: donation.donationId,
          bloodGroup,
          quantity: parseInt(quantity, 10),
          componentType: 'WHOLE_BLOOD',
          status: 'TESTING',
          testStatus: 'PENDING',
          expiryDate,
        },
      });

      await tx.donor.update({
        where: { donorId },
        data: { lastDonationDate: new Date() },
      });

      if (appointmentId) {
        await tx.appointment.update({
          where: { appointmentId },
          data: { status: 'COMPLETED' },
        });
      }

      return { donation, bloodUnit };
    });

    res.status(201).json({
      success: true,
      message: 'Donation logged and unit added to laboratory testing queue',
      ...result,
    });
  } catch (error) {
    console.error('Donation log error:', error);
    res.status(500).json({ error: 'Failed to record donation: ' + error.message });
  }
});

module.exports = router;
