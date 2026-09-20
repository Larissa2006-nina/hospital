require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { authenticateToken } = require('./src/middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// CORS Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Authentication Middleware
app.use(authenticateToken);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'BloodLink Hospital & Blood Donation REST API',
    timestamp: new Date().toISOString(),
  });
});

// Import Express API Routes
const authRoutes = require('./src/routes/auth.routes');
const hospitalRoutes = require('./src/routes/hospitals.routes');
const bloodRequestRoutes = require('./src/routes/blood-requests.routes');
const paymentRoutes = require('./src/routes/payments.routes');
const emergencyRoutes = require('./src/routes/emergency.routes');
const donationRoutes = require('./src/routes/donations.routes');
const appointmentRoutes = require('./src/routes/appointments.routes');
const bloodBankRoutes = require('./src/routes/blood-bank.routes');
const labRoutes = require('./src/routes/lab.routes');
const adminRoutes = require('./src/routes/admin.routes');
const notificationRoutes = require('./src/routes/notifications.routes');
const reportRoutes = require('./src/routes/reports.routes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/blood-requests', bloodRequestRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/blood-bank', bloodBankRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('API Express Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 BloodLink Express Backend API listening on http://localhost:${PORT}`);
});
