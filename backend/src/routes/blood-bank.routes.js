const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /api/blood-bank/inventory
router.get('/inventory', async (req, res) => {
  try {
    const auth = req.user;
    const { hospitalId: hospInput, bloodGroup, status } = req.query;
    const hospitalId = hospInput || auth?.hospitalId;

    let whereClause = {};
    if (hospitalId) {
      whereClause.bloodBank = { hospitalId };
    }
    if (bloodGroup) whereClause.bloodGroup = bloodGroup;
    if (status) whereClause.status = status;

    const bloodUnits = await prisma.bloodUnit.findMany({
      where: whereClause,
      include: {
        bloodBank: { include: { hospital: true } },
        labTechnician: { include: { user: { select: { name: true } } } },
      },
      orderBy: { collectionDate: 'desc' },
    });

    const stockByStatus = {
      TESTING: bloodUnits.filter(u => u.status === 'TESTING').length,
      APPROVED: bloodUnits.filter(u => u.status === 'APPROVED').length,
      AVAILABLE: bloodUnits.filter(u => u.status === 'AVAILABLE').length,
      RESERVED: bloodUnits.filter(u => u.status === 'RESERVED').length,
      ISSUED: bloodUnits.filter(u => u.status === 'ISSUED').length,
      DISCARDED: bloodUnits.filter(u => u.status === 'DISCARDED').length,
    };

    const stockByGroup = {
      A_POS: bloodUnits.filter(u => u.bloodGroup === 'A_POS' && u.status === 'AVAILABLE').length,
      A_NEG: bloodUnits.filter(u => u.bloodGroup === 'A_NEG' && u.status === 'AVAILABLE').length,
      B_POS: bloodUnits.filter(u => u.bloodGroup === 'B_POS' && u.status === 'AVAILABLE').length,
      B_NEG: bloodUnits.filter(u => u.bloodGroup === 'B_NEG' && u.status === 'AVAILABLE').length,
      AB_POS: bloodUnits.filter(u => u.bloodGroup === 'AB_POS' && u.status === 'AVAILABLE').length,
      AB_NEG: bloodUnits.filter(u => u.bloodGroup === 'AB_NEG' && u.status === 'AVAILABLE').length,
      O_POS: bloodUnits.filter(u => u.bloodGroup === 'O_POS' && u.status === 'AVAILABLE').length,
      O_NEG: bloodUnits.filter(u => u.bloodGroup === 'O_NEG' && u.status === 'AVAILABLE').length,
    };

    res.json({
      success: true,
      totalUnits: bloodUnits.length,
      stockByStatus,
      stockByGroup,
      bloodUnits,
    });
  } catch (error) {
    console.error('BloodBank inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch blood bank inventory' });
  }
});

module.exports = router;
