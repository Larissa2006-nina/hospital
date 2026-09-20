import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPaymentStatus } from '@/lib/payment';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('🔔 Received Payment Webhook Event:', JSON.stringify(body, null, 2));

    const {
      event,
      transactionId,
      paymentReference,
      paymentMethod = 'MTN_MOMO',
      amount,
      status = 'SUCCESS',
    } = body;

    // Support standard webhook payloads or Stripe event structures
    let targetTxnId = transactionId;
    let targetRef = paymentReference || body.id;
    let method = paymentMethod;

    if (body.data?.object) {
      const obj = body.data.object;
      targetRef = obj.id;
      if (obj.metadata?.transactionId) {
        targetTxnId = obj.metadata.transactionId;
      }
    }

    if (!targetTxnId && !targetRef) {
      return NextResponse.json({ error: 'Webhook payload missing transactionId or paymentReference' }, { status: 400 });
    }

    // Find transaction record
    let transaction = null;
    if (targetTxnId) {
      transaction = await prisma.bloodTransaction.findUnique({
        where: { transactionId: targetTxnId },
        include: {
          bloodRequest: {
            include: { hospital: { include: { user: true } } },
          },
          patient: { include: { user: true } },
          payment: true,
        },
      });
    }

    if (!transaction && targetRef) {
      const existingPayment = await prisma.payment.findFirst({
        where: { paymentReference: targetRef },
        include: { bloodTransaction: true },
      });
      if (existingPayment) {
        transaction = existingPayment.bloodTransaction;
      }
    }

    if (!transaction) {
      return NextResponse.json({ error: 'Associated transaction record not found' }, { status: 404 });
    }

    if (transaction.status === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        message: 'Transaction already processed and completed.',
      });
    }

    // 1. Create or Update Payment record
    const ref = targetRef || `wh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payment = await prisma.payment.upsert({
      where: { transactionId: transaction.transactionId },
      update: {
        status: 'COMPLETED',
        paymentMethod: method,
        paymentReference: ref,
        paymentDate: new Date(),
      },
      create: {
        transactionId: transaction.transactionId,
        amount: amount || transaction.amount,
        paymentMethod: method,
        paymentProvider: method === 'ORANGE_MONEY' ? 'ORANGE_MONEY' : method === 'MTN_MOMO' ? 'MTN_MOMO' : 'STRIPE_CARD',
        paymentReference: ref,
        paymentDate: new Date(),
        status: 'COMPLETED',
      },
    });

    // 2. Mark BloodTransaction as SUCCESS
    const updatedTransaction = await prisma.bloodTransaction.update({
      where: { transactionId: transaction.transactionId },
      data: { status: 'SUCCESS' },
    });

    // 3. Update BloodRequest to FULFILLED and reserved BloodUnits to ISSUED
    if (transaction.requestId) {
      await prisma.bloodRequest.update({
        where: { requestId: transaction.requestId },
        data: {
          status: 'FULFILLED',
          processedDate: new Date(),
        },
      });

      await prisma.bloodUnit.updateMany({
        where: {
          requestId: transaction.requestId,
          status: 'RESERVED',
        },
        data: { status: 'ISSUED' },
      });
    }

    // 4. Send Notifications
    if (transaction.patient?.user) {
      await prisma.notification.create({
        data: {
          userId: transaction.patient.user.id,
          title: 'Payment Confirmed via Webhook (' + method.replace('_', ' ') + ')',
          message: `Your payment of ${transaction.amount.toFixed(2)} ${transaction.currency} via ${method.replace('_', ' ')} has been confirmed. Ref: ${ref}. Blood units issued.`,
          notificationType: 'PAYMENT',
          linkUrl: '/patient/payments',
        },
      });
    }

    if (transaction.bloodRequest?.hospital?.user) {
      await prisma.notification.create({
        data: {
          userId: transaction.bloodRequest.hospital.user.id,
          title: 'Patient Payment Webhook Received',
          message: `Payment of ${transaction.amount.toFixed(2)} ${transaction.currency} for Request #${transaction.requestId.slice(-6)} verified via Webhook.`,
          notificationType: 'PAYMENT',
          linkUrl: '/hospital/transactions',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment webhook event verified and processed successfully.',
      payment,
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook execution failed: ' + error.message }, { status: 500 });
  }
}
