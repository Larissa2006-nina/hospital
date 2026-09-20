const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /api/reports
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let whereClause = {};
    if (type) whereClause.type = type;

    const reports = await prisma.report.findMany({
      where: whereClause,
      include: { admin: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: reports.length, reports });
  } catch (error) {
    console.error('Reports GET error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

module.exports = router;
