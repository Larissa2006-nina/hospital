'use client';

import React, { useState } from 'react';
import { Smartphone, CheckCircle2, AlertCircle, X, ShieldCheck, Lock } from 'lucide-react';

export default function PaymentModal({ transaction, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('MTN_MOMO'); // 'MTN_MOMO' | 'ORANGE_MONEY'
  
  // Mobile Money fields
  const [momoPhone, setMomoPhone] = useState(transaction?.patient?.user?.phone || '');
  const [orangePhone, setOrangePhone] = useState(transaction?.patient?.user?.phone || '');

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [instructions, setInstructions] = useState(null);

  if (!transaction) return null;

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const phoneNumber = paymentMethod === 'MTN_MOMO' ? momoPhone : orangePhone;

    if (!phoneNumber || phoneNumber.trim() === '') {
      setError('Please provide a valid mobile money phone number.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transaction.transactionId,
          paymentMethod,
          phoneNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Payment transaction failed');
      }

      setSuccess(true);
      if (data.instructions) setInstructions(data.instructions);
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
          padding: '22px 26px',
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
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Mobile Money Portal</h3>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                MTN Mobile Money & Orange Money Gateway
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
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle2 size={58} color="#10b981" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                Payment Prompt Triggered!
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                Transaction #{transaction.transactionReference} initialized via {paymentMethod === 'MTN_MOMO' ? 'MTN Mobile Money' : 'Orange Money'}.
              </p>
              {instructions && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  marginBottom: '20px',
                  textAlign: 'left',
                  lineHeight: '1.5',
                }}>
                  <strong>Next Steps:</strong> {instructions}
                </div>
              )}
              <button
                onClick={onClose}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                Close & View Request
              </button>
            </div>
          ) : (
            <form onSubmit={handlePay}>
              {/* Transaction Summary */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px 20px',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#64748b' }}>
                  <span>Description:</span>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>{transaction.description || 'Blood Unit Fee'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#64748b' }}>
                  <span>Ref:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#475569' }}>{transaction.transactionReference}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontSize: '16px', fontWeight: '700' }}>
                  <span>Amount Due:</span>
                  <span style={{ color: '#dc2626', fontSize: '18px' }}>${Number(transaction.amount).toFixed(2)} USD / XAF</span>
                </div>
              </div>

              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Payment Method Selector Tabs (MTN MoMo & Orange Money ONLY) */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: '600', marginBottom: '10px', display: 'block' }}>
                  Choose Mobile Payment Operator
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* MTN Mobile Money */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('MTN_MOMO')}
                    style={{
                      border: paymentMethod === 'MTN_MOMO' ? '2px solid #eab308' : '1px solid #e2e8f0',
                      background: paymentMethod === 'MTN_MOMO' ? '#fefce8' : '#ffffff',
                      borderRadius: '12px',
                      padding: '16px 12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Smartphone size={24} color={paymentMethod === 'MTN_MOMO' ? '#ca8a04' : '#64748b'} style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: '14px', fontWeight: '700', color: paymentMethod === 'MTN_MOMO' ? '#854d0e' : '#334155' }}>
                      MTN Mobile Money
                    </div>
                    <div style={{ fontSize: '11px', color: '#854d0e', opacity: 0.85, marginTop: '2px' }}>MTN MoMo (*126#)</div>
                  </button>

                  {/* Orange Money */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ORANGE_MONEY')}
                    style={{
                      border: paymentMethod === 'ORANGE_MONEY' ? '2px solid #f97316' : '1px solid #e2e8f0',
                      background: paymentMethod === 'ORANGE_MONEY' ? '#fff7ed' : '#ffffff',
                      borderRadius: '12px',
                      padding: '16px 12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Smartphone size={24} color={paymentMethod === 'ORANGE_MONEY' ? '#ea580c' : '#64748b'} style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: '14px', fontWeight: '700', color: paymentMethod === 'ORANGE_MONEY' ? '#9a3412' : '#334155' }}>
                      Orange Money
                    </div>
                    <div style={{ fontSize: '11px', color: '#9a3412', opacity: 0.85, marginTop: '2px' }}>OM Pay (*150#)</div>
                  </button>
                </div>
              </div>

              {/* Dynamic Mobile Inputs */}
              {paymentMethod === 'MTN_MOMO' && (
                <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#854d0e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Smartphone size={16} />
                    <span>Enter MTN Mobile Money Account</span>
                  </div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ fontSize: '12px', color: '#854d0e' }}>MTN Mobile Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g. 670 123 456 or +237 670123456"
                      value={momoPhone}
                      onChange={(e) => setMomoPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: '#a16207', lineHeight: '1.4' }}>
                    💡 A payment prompt will be pushed to your MTN phone. Dial <strong>*126#</strong> and enter your PIN to authorize.
                  </div>
                </div>
              )}

              {paymentMethod === 'ORANGE_MONEY' && (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#9a3412', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Smartphone size={16} />
                    <span>Enter Orange Money Account</span>
                  </div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ fontSize: '12px', color: '#9a3412' }}>Orange Mobile Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g. 690 123 456 or +237 690123456"
                      value={orangePhone}
                      onChange={(e) => setOrangePhone(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: '#c2410c', lineHeight: '1.4' }}>
                    💡 Dial <strong>*150#</strong> on your Orange phone to approve the payment authorization code.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
                <Lock size={14} color="#059669" />
                <span>Encrypted mobile transaction processed via official API & Webhooks</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                {loading
                  ? 'Requesting Mobile Payment...'
                  : `Pay $${Number(transaction.amount).toFixed(2)} via ${
                      paymentMethod === 'MTN_MOMO' ? 'MTN Mobile Money' : 'Orange Money'
                    }`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
