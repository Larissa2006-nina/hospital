'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { CreditCard, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';

export default function HospitalTransactionsPage() {
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
          <span>Hospital Financial Transactions & Revenue</span>
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Audit record of blood processing charges, cross-match fees, and verified patient Stripe payments.
        </p>
      </div>

      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Total Verified Revenue</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#059669' }}>
            ${data.totalRevenue.toFixed(2)} USD
          </div>
          <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>Paid via Stripe gateway</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Total Invoices Issued</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>
            {data.transactions.length}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Clinical blood orders</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Pending Collection</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#f59e0b' }}>
            ${data.transactions.filter(t => t.status === 'PENDING').reduce((s, t) => s + t.amount, 0).toFixed(2)} USD
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Awaiting patient checkout</div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading transactions...</div>
        ) : data.transactions.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            No financial transactions recorded.
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction Ref</th>
                  <th>Patient Name</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Stripe Reference</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t) => (
                  <tr key={t.transactionId}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>
                        {t.transactionReference}
                      </span>
                    </td>
                    <td>
                      <strong>{t.patient?.user?.name}</strong>
                    </td>
                    <td>
                      <strong style={{ fontSize: '15px', color: '#dc2626' }}>
                        ${t.amount.toFixed(2)} {t.currency}
                      </strong>
                    </td>
                    <td>{new Date(t.transactionDate).toLocaleDateString()}</td>
                    <td>{t.description}</td>
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
