'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { CreditCard, CheckCircle2, AlertCircle, Lock, ShieldCheck } from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';

export default function PatientPaymentsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payments');
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard size={24} color="#dc2626" />
            <span>Financial Transactions & Stripe Payments</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Secure checkout, processing invoices, and transaction payment receipts.
          </p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading invoices...</div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <CreditCard size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
              No Invoices Generated
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              When your blood requests are approved by the hospital, processing invoices will appear here.
            </p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction Reference</th>
                  <th>Hospital Center</th>
                  <th>Amount (USD)</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Payment Status</th>
                  <th>Action / Gateway Ref</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.transactionId}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>
                        {t.transactionReference}
                      </span>
                    </td>
                    <td>
                      <strong>{t.bloodRequest?.hospital?.name || 'Hospital Center'}</strong>
                    </td>
                    <td>
                      <strong style={{ fontSize: '15px', color: '#dc2626' }}>
                        ${t.amount.toFixed(2)} {t.currency}
                      </strong>
                    </td>
                    <td>{new Date(t.transactionDate).toLocaleDateString()}</td>
                    <td>
                      <span style={{ fontSize: '13px', color: '#475569' }}>
                        {t.description || 'Blood Unit Processing Fee'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${t.status === 'SUCCESS' ? 'badge-success' : t.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      {t.status === 'PENDING' ? (
                        <button
                          onClick={() => setSelectedTxn(t)}
                          className="btn btn-primary btn-sm"
                        >
                          <CreditCard size={14} />
                          <span>Pay with Stripe</span>
                        </button>
                      ) : (
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#059669', background: '#ecfdf5', padding: '4px 8px', borderRadius: '6px' }}>
                          {t.payment?.paymentReference || 'STRIPE_VERIFIED'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTxn && (
        <PaymentModal
          transaction={selectedTxn}
          onClose={() => setSelectedTxn(null)}
          onSuccess={() => {
            setSelectedTxn(null);
            fetchPayments();
          }}
        />
      )}
    </DashboardLayout>
  );
}
