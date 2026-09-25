'use client';

import React, { useState } from 'react';
import { Smartphone, CheckCircle2, AlertCircle, X, ShieldCheck, Lock, KeyRound, MessageSquare, ArrowLeft, RefreshCw } from 'lucide-react';

export default function PaymentModal({ transaction, onClose, onSuccess }) {
  const [step, setStep] = useState('PHONE_INPUT'); // 'PHONE_INPUT' | 'ENTER_PIN' | 'SUCCESS'
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('MTN_MOMO'); // 'MTN_MOMO' | 'ORANGE_MONEY'
  
  // Phone & PIN states
  const [phone, setPhone] = useState(transaction?.patient?.user?.phone || '');
  const [pinCode, setPinCode] = useState('');
  const [simulatedSms, setSimulatedSms] = useState(null);

  const [error, setError] = useState(null);
  const [instructions, setInstructions] = useState(null);

  if (!transaction) return null;

  // Step 1: Request PIN code to be sent to patient's phone number
  const handleRequestPin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!phone || phone.trim() === '') {
      setError('Please enter a valid phone number to receive your payment PIN code.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_PIN',
          transactionId: transaction.transactionId,
          phoneNumber: phone,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send PIN request to phone number.');
      }

      setSimulatedSms({
        phone: data.pinSentTo,
        pinCode: data.pinCode,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setInstructions(data.instructions);
      setStep('ENTER_PIN');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify PIN code & authorize payment
  const handleVerifyPin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!pinCode || pinCode.trim().length < 4) {
      setError('Please enter the valid 6-digit PIN code sent to your phone.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_PIN',
          transactionId: transaction.transactionId,
          pinCode,
          phoneNumber: phone,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'PIN verification failed');
      }

      setStep('SUCCESS');
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShieldCheck size={22} color="#ef4444" />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', margin: 0 }}>
                {step === 'ENTER_PIN' ? 'Phone PIN Code Verification' : 'Mobile PIN Payment Portal'}
              </h3>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Secure PIN Prompt Authorization
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '24px' }}>

          {/* STEP 3: SUCCESS SCREEN */}
          {step === 'SUCCESS' ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <CheckCircle2 size={58} color="#10b981" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                Payment Verified & Completed!
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                PIN authorization confirmed for phone <strong>{phone}</strong>. Transaction #${transaction.transactionReference} is now marked as <strong>SUCCESS</strong>.
              </p>
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                padding: '14px 16px',
                borderRadius: '12px',
                fontSize: '13px',
                marginBottom: '20px',
                textAlign: 'left',
              }}>
                <strong>Status update:</strong> Blood units reserved for this request have been issued to the hospital ward.
              </div>
              <button
                onClick={onClose}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                Close & View Request
              </button>
            </div>
          ) : step === 'ENTER_PIN' ? (

            /* STEP 2: ENTER PIN CODE */
            <form onSubmit={handleVerifyPin}>
              {/* Simulated Phone SMS Prompt Banner */}
              {simulatedSms && (
                <div
                  onClick={() => setPinCode(simulatedSms.pinCode)}
                  style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    color: '#ffffff',
                    border: '1.5px solid #38bdf8',
                    borderRadius: '14px',
                    padding: '14px',
                    marginBottom: '20px',
                    boxShadow: '0 8px 20px rgba(56, 189, 248, 0.15)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#38bdf8', fontWeight: '700' }}>
                      <MessageSquare size={14} />
                      <span>SMS Alert sent to {simulatedSms.phone}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{simulatedSms.time}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#f1f5f9', lineHeight: '1.4' }}>
                    Your BloodLink payment verification PIN code is <strong style={{ color: '#38bdf8', fontSize: '15px', letterSpacing: '2px' }}>{simulatedSms.pinCode}</strong>.
                  </div>
                  <div style={{ fontSize: '10px', color: '#38bdf8', marginTop: '6px', fontStyle: 'italic' }}>
                    💡 Click here to auto-fill PIN code into input box
                  </div>
                </div>
              )}

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '20px',
              }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Authorization Requested For:</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span>{phone}</span>
                  <span style={{ color: '#dc2626' }}>${Number(transaction.amount).toFixed(2)} USD</span>
                </div>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <KeyRound size={16} color="#dc2626" />
                  <span>Enter 6-Digit PIN Code Received on Phone</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  className="form-input"
                  placeholder="e.g. 849201"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    fontSize: '22px',
                    letterSpacing: '8px',
                    textAlign: 'center',
                    fontWeight: '800',
                    color: '#0f172a',
                    padding: '12px',
                  }}
                  required
                  autoFocus
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', display: 'block' }}>
                  Check your phone SMS messages for the authorization PIN code.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px', marginBottom: '12px' }}
              >
                {loading ? 'Verifying PIN Code...' : `Verify PIN & Authorize $${Number(transaction.amount).toFixed(2)}`}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setStep('PHONE_INPUT'); setError(null); }}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <ArrowLeft size={14} /> Change Phone Number
                </button>
                <button
                  type="button"
                  onClick={handleRequestPin}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RefreshCw size={14} /> Resend PIN Code
                </button>
              </div>
            </form>
          ) : (

            /* STEP 1: ENTER PHONE NUMBER & REQUEST PIN */
            <form onSubmit={handleRequestPin}>
              {/* Transaction Summary */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px 20px',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#64748b' }}>
                  <span>Invoice Description:</span>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>{transaction.description || 'Blood Unit Fee'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#64748b' }}>
                  <span>Transaction Ref:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#475569' }}>{transaction.transactionReference}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontSize: '16px', fontWeight: '700' }}>
                  <span>Total Amount:</span>
                  <span style={{ color: '#dc2626', fontSize: '18px' }}>${Number(transaction.amount).toFixed(2)} USD</span>
                </div>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Payment Method Tabs */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: '600', marginBottom: '10px', display: 'block' }}>
                  Select Mobile Payment Network
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('MTN_MOMO')}
                    style={{
                      border: paymentMethod === 'MTN_MOMO' ? '2px solid #eab308' : '1px solid #e2e8f0',
                      background: paymentMethod === 'MTN_MOMO' ? '#fefce8' : '#ffffff',
                      borderRadius: '12px',
                      padding: '14px 12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <Smartphone size={22} color={paymentMethod === 'MTN_MOMO' ? '#ca8a04' : '#64748b'} style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: '13px', fontWeight: '700', color: paymentMethod === 'MTN_MOMO' ? '#854d0e' : '#334155' }}>
                      MTN Mobile Money
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ORANGE_MONEY')}
                    style={{
                      border: paymentMethod === 'ORANGE_MONEY' ? '2px solid #f97316' : '1px solid #e2e8f0',
                      background: paymentMethod === 'ORANGE_MONEY' ? '#fff7ed' : '#ffffff',
                      borderRadius: '12px',
                      padding: '14px 12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <Smartphone size={22} color={paymentMethod === 'ORANGE_MONEY' ? '#ea580c' : '#64748b'} style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: '13px', fontWeight: '700', color: paymentMethod === 'ORANGE_MONEY' ? '#9a3412' : '#334155' }}>
                      Orange Money
                    </div>
                  </button>
                </div>
              </div>

              {/* Phone Input Field */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: '600', color: '#0f172a' }}>
                  Target Phone Number to Send Payment PIN
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +237 670 123 456 or 690123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  📱 A 6-digit PIN verification code will be sent to this phone number.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
                <Lock size={14} color="#059669" />
                <span>SMS PIN verification prevents unauthorized transactions</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                {loading ? 'Sending PIN Request...' : 'Send Payment PIN Request to Phone →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
