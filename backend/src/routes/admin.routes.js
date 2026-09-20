const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    let whereClause = {};
    if (role) whereClause.role = role;

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        donor: true,
        patient: true,
        hospital: true,
        labTechnician: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error('Admin users GET error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [hospitalsCount, usersCount, donorsCount, requestsCount, unitsCount, transactions] = await Promise.all([
      prisma.hospital.count(),
      prisma.user.count(),
      prisma.donor.count(),
      prisma.bloodRequest.count(),
      prisma.bloodUnit.count(),
      prisma.bloodTransaction.findMany({ where: { status: 'SUCCESS' } }),
    ]);

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      stats: {
        hospitalsCount,
        usersCount,
        donorsCount,
        requestsCount,
        unitsCount,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

module.exports = router;
