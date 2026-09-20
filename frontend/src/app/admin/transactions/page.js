'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { CreditCard, DollarSign, CheckCircle2 } from 'lucide-react';

export default function AdminTransactionsPage() {
  const [data, setData] = useState({ totalRevenue: 0, transactions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/payments')
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setData(resData);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CreditCard size={24} color="#dc2626" />
          <span>Global Financial Transactions & Payments Ledger</span>
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Consolidated audit trail of all patient blood processing payments and Stripe references.
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading ledger...</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction Reference</th>
                  <th>Patient</th>
                  <th>Hospital</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Payment Gateway Ref</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t) => (
                  <tr key={t.transactionId}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{t.transactionReference}</span>
                    </td>
                    <td><strong>{t.patient?.user?.name}</strong></td>
                    <td>{t.bloodRequest?.hospital?.name}</td>
                    <td><strong style={{ color: '#dc2626' }}>${t.amount.toFixed(2)} {t.currency}</strong></td>
                    <td>{new Date(t.transactionDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${t.status === 'SUCCESS' ? 'badge-success' : 'badge-warning'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#059669', background: '#ecfdf5', padding: '4px 8px', borderRadius: '6px' }}>
                        {t.payment?.paymentReference || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
