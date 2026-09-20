const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /api/appointments
router.get('/', async (req, res) => {
  try {
    const auth = req.user;
    const { donorId, hospitalId, status } = req.query;

    let whereClause = {};
    if (donorId) whereClause.donorId = donorId;
    else if (hospitalId) whereClause.hospitalId = hospitalId;
    else if (auth) {
      if (auth.role === 'DONOR' && auth.donorId) whereClause.donorId = auth.donorId;
      else if ((auth.role === 'HOSPITAL' || auth.role === 'LAB_TECH') && auth.hospitalId) whereClause.hospitalId = auth.hospitalId;
    }
    if (status) whereClause.status = status;

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        donor: { include: { user: { select: { name: true, email: true, phone: true } } } },
        hospital: { select: { name: true, address: true, city: true } },
      },
      orderBy: [{ appointmentDate: 'desc' }, { appointmentTime: 'asc' }],
    });

    res.json({ success: true, count: appointments.length, appointments });
  } catch (error) {
    console.error('Appointments GET error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// POST /api/appointments
router.post('/', async (req, res) => {
  try {
    const auth = req.user;
    const { donorId: donorInput, hospitalId, appointmentDate, appointmentTime, appointmentType = 'WHOLE_BLOOD', notes } = req.body;
    const donorId = donorInput || auth?.donorId;

    if (!donorId || !hospitalId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ error: 'Missing required appointment fields' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        donorId,
        hospitalId,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        appointmentType,
        status: 'CONFIRMED',
        notes,
      },
      include: {
        hospital: { include: { user: true } },
        donor: { include: { user: true } },
      },
    });

    if (appointment.donor?.user) {
      await prisma.notification.create({
        data: {
          userId: appointment.donor.user.id,
          title: 'Donation Appointment Confirmed',
          message: `Appointment scheduled at ${appointment.hospital.name} for ${new Date(appointmentDate).toLocaleDateString()} at ${appointmentTime}.`,
          notificationType: 'APPOINTMENT',
          linkUrl: '/donor/history',
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment,
    });
  } catch (error) {
    console.error('Appointment booking error:', error);
    res.status(500).json({ error: 'Failed to book appointment: ' + error.message });
  }
});

module.exports = router;
