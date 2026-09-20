import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { createPaymentIntent, verifyPaymentStatus } from '@/lib/payment';

// GET: List financial transactions and payments
export async function GET(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const hospitalId = searchParams.get('hospitalId');

    let whereClause = {};
    if (patientId) whereClause.patientId = patientId;
    else if (hospitalId) whereClause.bloodRequest = { hospitalId };
    else if (auth) {
      if (auth.role === 'PATIENT' && auth.patientId) whereClause.patientId = auth.patientId;
      else if (auth.role === 'HOSPITAL' && auth.hospitalId) {
        whereClause.bloodRequest = { hospitalId: auth.hospitalId };
      }
    }

    const transactions = await prisma.bloodTransaction.findMany({
      where: whereClause,
      include: {
        payment: true,
        patient: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
          },
        },
        bloodRequest: {
          include: { hospital: true },
        },
      },
      orderBy: { transactionDate: 'desc' },
    });

    const totalRevenue = transactions
      .filter(t => t.status === 'SUCCESS')
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      success: true,
      totalRevenue,
      transactions,
    });
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

// POST: Execute and verify payment for a BloodTransaction
export async function POST(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    const body = await request.json();
    const {
      transactionId,
      paymentMethod = 'STRIPE_CREDIT_CARD',
      cardNumber,
      cardExpiry,
    } = body;

    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId is required' }, { status: 400 });
    }

    // 1. Fetch BloodTransaction
    const transaction = await prisma.bloodTransaction.findUnique({
      where: { transactionId },
      include: {
        bloodRequest: {
          include: {
            hospital: { include: { user: true } },
          },
        },
        patient: {
          include: { user: true },
        },
        payment: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Financial transaction record not found' }, { status: 404 });
    }

    if (transaction.status === 'SUCCESS') {
      return NextResponse.json({ error: 'This transaction has already been successfully paid.' }, { status: 400 });
    }

    // 2. Process via Payment Gateway (Stripe, MTN MoMo, Orange Money)
    const intentResult = await createPaymentIntent({
      amount: transaction.amount,
      currency: transaction.currency,
      paymentMethod,
      phoneNumber: body.phoneNumber,
      description: transaction.description || 'Blood processing fee',
      metadata: {
        transactionId: transaction.transactionId,
        requestId: transaction.requestId,
        patientId: transaction.patientId,
      },
    });

    const verification = await verifyPaymentStatus(intentResult.paymentReference, intentResult.provider);


    if (!verification.verified) {
      return NextResponse.json({ error: 'Payment authorization failed with payment provider' }, { status: 402 });
    }

    // 3. Create Payment entity record (Relationship: BloodTransaction 1 -> 0..1 Payment)
    const payment = await prisma.payment.create({
      data: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        paymentMethod,
        paymentProvider: verification.provider || 'STRIPE',
        paymentReference: intentResult.paymentReference,
        paymentDate: new Date(),
        status: 'COMPLETED',
      },
    });

    // 4. Update BloodTransaction status to SUCCESS
    const updatedTransaction = await prisma.bloodTransaction.update({
      where: { transactionId: transaction.transactionId },
      data: { status: 'SUCCESS' },
    });

    // 5. Update BloodRequest status to FULFILLED and update BloodUnits to ISSUED
    if (transaction.requestId) {
      await prisma.bloodRequest.update({
        where: { requestId: transaction.requestId },
        data: {
          status: 'FULFILLED',
          processedDate: new Date(),
        },
      });

      // Mark reserved units as ISSUED
      await prisma.bloodUnit.updateMany({
        where: {
          requestId: transaction.requestId,
          status: 'RESERVED',
        },
        data: { status: 'ISSUED' },
      });
    }

    // 6. Notify Patient
    await prisma.notification.create({
      data: {
        userId: transaction.patient.user.id,
        title: 'Payment Successful ($' + transaction.amount.toFixed(2) + ')',
        message: `Your payment of $${transaction.amount.toFixed(2)} for ${transaction.description} has been confirmed. Ref: ${payment.paymentReference}. Blood units have been issued.`,
        notificationType: 'PAYMENT',
        linkUrl: '/patient/payments',
      },
    });

    // 7. Notify Hospital
    if (transaction.bloodRequest?.hospital?.user) {
      await prisma.notification.create({
        data: {
          userId: transaction.bloodRequest.hospital.user.id,
          title: 'Patient Payment Received',
          message: `Patient ${transaction.patient.user.name} completed payment of $${transaction.amount.toFixed(2)} for Request #${transaction.requestId.slice(-6)}.`,
          notificationType: 'PAYMENT',
          linkUrl: '/hospital/transactions',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment processed and verified successfully. Blood units issued.',
      payment,
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error('Payment execution error:', error);
    return NextResponse.json({ error: 'Payment failed: ' + error.message }, { status: 500 });
  }
}
