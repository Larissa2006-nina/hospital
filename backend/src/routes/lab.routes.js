const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /api/lab
router.get('/', async (req, res) => {
  try {
    const auth = req.user;
    const { hospitalId: hospInput, status } = req.query;
    const hospitalId = hospInput || auth?.hospitalId;

    let whereClause = {};
    if (hospitalId) whereClause.bloodBank = { hospitalId };
    if (status) whereClause.status = status;

    const units = await prisma.bloodUnit.findMany({
      where: whereClause,
      include: {
        bloodBank: { include: { hospital: true } },
        bloodDonation: { include: { donor: { include: { user: { select: { name: true } } } } } },
        labTechnician: { include: { user: { select: { name: true } } } },
      },
      orderBy: { collectionDate: 'desc' },
    });

    res.json({ success: true, units });
  } catch (error) {
    console.error('Lab GET error:', error);
    res.status(500).json({ error: 'Failed to fetch lab screening units' });
  }
});

// POST /api/lab/verify
router.post('/verify', async (req, res) => {
  try {
    const auth = req.user;
    const { bloodUnitId, hivTest = 'NEGATIVE', hbvTest = 'NEGATIVE', hcvTest = 'NEGATIVE', syphilisTest = 'NEGATIVE', testNotes } = req.body;

    if (!bloodUnitId) {
      return res.status(400).json({ error: 'bloodUnitId is required' });
    }

    const hasInfection = [hivTest, hbvTest, hcvTest, syphilisTest].some(t => t === 'POSITIVE');
    const newStatus = hasInfection ? 'DISCARDED' : 'AVAILABLE';
    const testStatus = hasInfection ? 'FAILED' : 'PASSED';

    const updatedUnit = await prisma.bloodUnit.update({
      where: { bloodUnitId },
      data: {
        hivTest,
        hbvTest,
        hcvTest,
        syphilisTest,
        testNotes,
        status: newStatus,
        testStatus,
        testedAt: new Date(),
        labTechId: auth?.labTechId || null,
      },
      include: { bloodBank: { include: { hospital: true } } },
    });

    res.json({
      success: true,
      message: hasInfection
        ? 'Pathogen detected! Blood unit marked as DISCARDED for safety compliance.'
        : 'Laboratory screening PASSED! Blood unit moved to live inventory storage.',
      unit: updatedUnit,
    });
  } catch (error) {
    console.error('Lab verification error:', error);
    res.status(500).json({ error: 'Lab verification failed: ' + error.message });
  }
});

module.exports = router;
