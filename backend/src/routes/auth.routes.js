const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        administrator: true,
        donor: true,
        patient: true,
        labTechnician: true,
        hospital: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let roleData = {};
    if (user.role === 'ADMIN') roleData.adminId = user.administrator?.adminId;
    if (user.role === 'DONOR') roleData.donorId = user.donor?.donorId;
    if (user.role === 'PATIENT') roleData.patientId = user.patient?.patientId;
    if (user.role === 'LAB_TECH') {
      roleData.labTechId = user.labTechnician?.labTechId;
      roleData.hospitalId = user.labTechnician?.hospitalId;
    }
    if (user.role === 'HOSPITAL') roleData.hospitalId = user.hospital?.hospitalId;

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      ...roleData,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: payload,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to authenticate user' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'DONOR', phone, dateOfBirth, gender, bloodGroup, medicalId, address, city } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name,
          role,
          phone,
        },
      });

      if (role === 'DONOR') {
        await tx.donor.create({
          data: {
            userId: u.id,
            bloodGroup: bloodGroup || 'O_POS',
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('1995-01-01'),
            gender: gender || 'Unspecified',
            address,
            city,
          },
        });
      } else if (role === 'PATIENT') {
        await tx.patient.create({
          data: {
            userId: u.id,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('1995-01-01'),
            gender: gender || 'Unspecified',
            medicalId: medicalId || `MED-${Date.now().toString().slice(-6)}`,
            address,
            city,
          },
        });
      }

      return u;
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ success: true, user: req.user });
});

module.exports = router;
