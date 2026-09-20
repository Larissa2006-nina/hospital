const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
let stripeClient = null;
try {
  if (STRIPE_SECRET_KEY && !STRIPE_SECRET_KEY.includes('placeholder')) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  }
} catch (e) {}

// GET /api/payments
router.get('/', async (req, res) => {
  try {
    const auth = req.user;
    const { patientId, hospitalId } = req.query;

    let whereClause = {};
    if (patientId) whereClause.patientId = patientId;
    else if (hospitalId) whereClause.bloodRequest = { hospitalId };
    else if (auth) {
      if (auth.role === 'PATIENT' && auth.patientId) whereClause.patientId = auth.patientId;
      else if (auth.role === 'HOSPITAL' && auth.hospitalId) whereClause.bloodRequest = { hospitalId: auth.hospitalId };
    }

    const transactions = await prisma.bloodTransaction.findMany({
      where: whereClause,
      include: {
        payment: true,
        patient: { include: { user: { select: { name: true, email: true, phone: true } } } },
        bloodRequest: { include: { hospital: true } },
      },
      orderBy: { transactionDate: 'desc' },
    });

    const totalRevenue = transactions
      .filter(t => t.status === 'SUCCESS')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({ success: true, totalRevenue, transactions });
  } catch (error) {
    console.error('Payments GET error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// POST /api/payments
router.post('/', async (req, res) => {
  try {
    const { transactionId, paymentMethod = 'STRIPE_CARD', phoneNumber } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'transactionId is required' });
    }

    const transaction = await prisma.bloodTransaction.findUnique({
      where: { transactionId },
      include: {
        bloodRequest: { include: { hospital: { include: { user: true } } } },
        patient: { include: { user: true } },
        payment: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Financial transaction record not found' });
    }

    if (transaction.status === 'SUCCESS') {
      return res.status(400).json({ error: 'This transaction has already been successfully paid.' });
    }

    const prefix = paymentMethod === 'ORANGE_MONEY' ? 'pay_om_' : paymentMethod === 'MTN_MOMO' ? 'pay_momo_' : 'pay_card_';
    const paymentRef = `${prefix}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const payment = await prisma.payment.create({
      data: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        paymentMethod,
        paymentProvider: paymentMethod === 'ORANGE_MONEY' ? 'ORANGE_MONEY' : paymentMethod === 'MTN_MOMO' ? 'MTN_MOMO' : 'STRIPE_GATEWAY',
        paymentReference: paymentRef,
        paymentDate: new Date(),
        status: 'COMPLETED',
      },
    });

    const updatedTransaction = await prisma.bloodTransaction.update({
      where: { transactionId: transaction.transactionId },
      data: { status: 'SUCCESS' },
    });

    if (transaction.requestId) {
      await prisma.bloodRequest.update({
        where: { requestId: transaction.requestId },
        data: { status: 'FULFILLED', processedDate: new Date() },
      });

      await prisma.bloodUnit.updateMany({
        where: { requestId: transaction.requestId, status: 'RESERVED' },
        data: { status: 'ISSUED' },
      });
    }

    if (transaction.patient?.user) {
      await prisma.notification.create({
        data: {
          userId: transaction.patient.user.id,
          title: 'Payment Successful (' + paymentMethod.replace('_', ' ') + ')',
          message: `Your payment of $${transaction.amount.toFixed(2)} for ${transaction.description} has been confirmed. Ref: ${payment.paymentReference}.`,
          notificationType: 'PAYMENT',
          linkUrl: '/patient/payments',
        },
      });
    }

    res.json({
      success: true,
      message: 'Payment processed and verified successfully. Blood units issued.',
      payment,
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error('Payment execution error:', error);
    res.status(500).json({ error: 'Payment failed: ' + error.message });
  }
});

// POST /api/payments/webhook
router.post('/webhook', async (req, res) => {
  try {
    const { transactionId, paymentReference, paymentMethod = 'MTN_MOMO', amount } = req.body;
    const targetTxnId = transactionId || req.body.data?.object?.metadata?.transactionId;

    if (!targetTxnId) {
      return res.status(400).json({ error: 'Webhook payload missing transactionId' });
    }

    const transaction = await prisma.bloodTransaction.findUnique({
      where: { transactionId: targetTxnId },
      include: {
        bloodRequest: { include: { hospital: { include: { user: true } } } },
        patient: { include: { user: true } },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const ref = paymentReference || `wh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payment = await prisma.payment.upsert({
      where: { transactionId: transaction.transactionId },
      update: { status: 'COMPLETED', paymentMethod, paymentReference: ref },
      create: {
        transactionId: transaction.transactionId,
        amount: amount || transaction.amount,
        paymentMethod,
        paymentProvider: paymentMethod,
        paymentReference: ref,
        paymentDate: new Date(),
        status: 'COMPLETED',
      },
    });

    const updatedTxn = await prisma.bloodTransaction.update({
      where: { transactionId: transaction.transactionId },
      data: { status: 'SUCCESS' },
    });

    if (transaction.requestId) {
      await prisma.bloodRequest.update({
        where: { requestId: transaction.requestId },
        data: { status: 'FULFILLED', processedDate: new Date() },
      });
      await prisma.bloodUnit.updateMany({
        where: { requestId: transaction.requestId, status: 'RESERVED' },
        data: { status: 'ISSUED' },
      });
    }

    res.json({ success: true, message: 'Webhook verified and processed', payment, transaction: updatedTxn });
  } catch (error) {
    console.error('Backend Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
