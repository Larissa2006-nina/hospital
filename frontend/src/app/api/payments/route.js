import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import {
  createPaymentIntent,
  verifyPaymentStatus,
  requestPaymentPinCode,
  verifyPaymentPinCode,
} from '@/lib/payment';

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

// POST: Process PIN generation, PIN verification, or direct payment execution
export async function POST(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    const body = await request.json();
    const {
      transactionId,
      action, // 'REQUEST_PIN' | 'VERIFY_PIN' | null
      phoneNumber,
      pinCode,
      paymentMethod = 'MTN_MOMO',
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

    // -------------------------------------------------------------
    // ACTION 1: REQUEST PIN CODE (SMS / USSD Push)
    // -------------------------------------------------------------
    if (action === 'REQUEST_PIN') {
      const pinResult = requestPaymentPinCode({
        transactionId,
        phoneNumber: phoneNumber || transaction.patient?.user?.phone,
      });

      return NextResponse.json({
        success: true,
        step: 'REQUIRE_PIN',
        pinSentTo: pinResult.pinSentTo,
        pinCode: pinResult.pinCode, // Provided for easy UI demonstration
        instructions: pinResult.instructions,
      });
    }

    // -------------------------------------------------------------
    // ACTION 2: VERIFY PIN CODE & EXECUTE PAYMENT
    // -------------------------------------------------------------
    if (action === 'VERIFY_PIN' || pinCode) {
      const pinValidation = verifyPaymentPinCode({ transactionId, pinCode });

      if (!pinValidation.valid) {
        return NextResponse.json({ error: pinValidation.error }, { status: 400 });
      }
    }

    // 3. Process via Payment Gateway & Create Payment Entity
    const intentResult = await createPaymentIntent({
      amount: transaction.amount,
      currency: transaction.currency,
      paymentMethod,
      phoneNumber: phoneNumber || transaction.patient?.user?.phone,
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

    // 4. Create Payment entity record
    const payment = await prisma.payment.create({
      data: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        paymentMethod,
        paymentProvider: verification.provider || 'MOBILE_PIN_PAYMENT',
        paymentReference: intentResult.paymentReference,
        paymentDate: new Date(),
        status: 'COMPLETED',
      },
    });

    // 5. Update BloodTransaction status to SUCCESS
    const updatedTransaction = await prisma.bloodTransaction.update({
      where: { transactionId: transaction.transactionId },
      data: { status: 'SUCCESS' },
    });

    // 6. Update BloodRequest status to FULFILLED and update BloodUnits to ISSUED
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

    // 7. Notify Patient
    await prisma.notification.create({
      data: {
        userId: transaction.patient.user.id,
        title: 'Payment Successful ($' + transaction.amount.toFixed(2) + ')',
        message: `Your payment of $${transaction.amount.toFixed(2)} via ${paymentMethod} has been confirmed with PIN verification. Ref: ${payment.paymentReference}. Blood units issued.`,
        notificationType: 'PAYMENT',
        linkUrl: '/patient/payments',
      },
    });

    // 8. Notify Hospital
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
      message: 'PIN verified successfully! Payment processed and blood units issued.',
      payment,
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error('Payment execution error:', error);
    return NextResponse.json({ error: 'Payment failed: ' + error.message }, { status: 500 });
  }
}
