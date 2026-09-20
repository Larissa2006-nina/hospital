const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

// GET /api/hospitals
router.get('/', async (req, res) => {
  try {
    const { city, status = 'ACTIVE' } = req.query;

    let whereClause = {};
    if (status) whereClause.status = status;
    if (city) whereClause.city = { contains: city, mode: 'insensitive' };

    const hospitals = await prisma.hospital.findMany({
      where: whereClause,
      include: {
        bloodBank: {
          include: {
            bloodUnits: {
              where: { status: 'AVAILABLE' },
              select: { bloodUnitId: true, bloodGroup: true, componentType: true, quantity: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, count: hospitals.length, hospitals });
  } catch (error) {
    console.error('Hospitals GET error:', error);
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
});

// POST /api/hospitals - Register new hospital account (Admin)
router.post('/', async (req, res) => {
  try {
    const {
      hospitalName,
      email,
      password,
      phone,
      licenseNumber,
      address,
      city,
      contactNumber,
      latitude,
      longitude,
      bloodBankName,
    } = req.body;

    if (!hospitalName || !email || !password || !licenseNumber || !address || !city || !contactNumber) {
      return res.status(400).json({ error: 'Missing required hospital fields' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        name: hospitalName,
        role: 'HOSPITAL',
        phone: phone || contactNumber,
        hospital: {
          create: {
            name: hospitalName,
            licenseNumber: String(licenseNumber).trim(),
            address: String(address).trim(),
            city: String(city).trim(),
            contactNumber: String(contactNumber).trim(),
            email: cleanEmail,
            latitude: Number(latitude) || 4.0511,
            longitude: Number(longitude) || 9.7679,
            status: 'ACTIVE',
          },
        },
      },
      include: { hospital: true },
    });

    await prisma.bloodBank.create({
      data: {
        name: bloodBankName || `${hospitalName} Blood Bank`,
        hospitalId: user.hospital.hospitalId,
        location: `${address}, ${city}`,
        contactNumber: String(contactNumber).trim(),
        status: 'ACTIVE',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Hospital account created successfully',
      user: { id: user.id, email: user.email, name: user.name, role: user.role, hospitalId: user.hospital.hospitalId },
    });
  } catch (error) {
    console.error('Create hospital error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hospitals/lab-technicians
router.get('/lab-technicians', async (req, res) => {
  try {
    const { hospitalId } = req.query;
    let whereClause = {};
    if (hospitalId) whereClause.hospitalId = hospitalId;

    const labTechnicians = await prisma.labTechnician.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        hospital: { select: { hospitalId: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, labTechnicians });
  } catch (error) {
    console.error('Lab technicians fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/hospitals/lab-technicians
router.post('/lab-technicians', async (req, res) => {
  try {
    const { email, password, name, phone, hospitalId, licenseNumber, qualification } = req.body;

    if (!email || !password || !name || !hospitalId) {
      return res.status(400).json({ error: 'Email, password, name, and hospitalId are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const finalLicenseNumber = licenseNumber || `LAB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        name,
        role: 'LAB_TECH',
        phone,
        labTechnician: {
          create: {
            hospitalId,
            licenseNumber: finalLicenseNumber,
            qualification: qualification || 'Medical Laboratory Technician',
            status: 'ACTIVE',
          },
        },
      },
      include: { labTechnician: true },
    });

    res.status(201).json({ success: true, message: 'Lab Technician created successfully', user });
  } catch (error) {
    console.error('Create lab tech error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hospitals/:id
router.get('/:id', async (req, res) => {
  try {
    const hospital = await prisma.hospital.findUnique({
      where: { hospitalId: req.params.id },
      include: {
        bloodBank: {
          include: {
            bloodUnits: {
              where: { status: 'AVAILABLE' },
            },
          },
        },
        labTechnicians: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    res.json({ success: true, hospital });
  } catch (error) {
    console.error('Hospital detail error:', error);
    res.status(500).json({ error: 'Failed to fetch hospital details' });
  }
});

module.exports = router;
