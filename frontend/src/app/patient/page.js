'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Heart, Activity, CreditCard, Clock, CheckCircle2, AlertCircle, ArrowRight, FileText } from 'lucide-react';
import Link from 'next/link';
import PaymentModal from '@/components/PaymentModal';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, [user]);

  const fetchPatientData = async () => {
    try {
      const [reqRes, txRes] = await Promise.all([
        fetch('/api/blood-requests'),
        fetch('/api/payments'),
      ]);

      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData.requests || []);
      }
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }
    } catch (e) {
      console.error('Error fetching patient dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const approvedRequests = requests.filter(r => r.status === 'APPROVED');
  const fulfilledRequests = requests.filter(r => r.status === 'FULFILLED');
  const pendingPayments = transactions.filter(t => t.status === 'PENDING');

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '24px', marginBottom: '32px' }}>
        <div className="card" style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
          color: '#ffffff',
          padding: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', marginBottom: '12px' }}>
              Patient Clinical Portal
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', color: '#ffffff' }}>
              Welcome, {user?.name || 'Patient'}!
            </h1>
            <p style={{ color: '#d1fae5', fontSize: '14px', maxWidth: '480px', lineHeight: '1.5' }}>
              Submit blood requests directly to regional hospital blood banks, track cross-matching approval, and complete secure processing payments.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <Link href="/patient/new-request" className="btn btn-primary btn-sm" style={{ background: '#ffffff', color: '#065f46' }}>
                <Heart size={16} color="#dc2626" />
                <span>Submit New Blood Request</span>
              </Link>
              <Link href="/patient/requests" className="btn btn-secondary btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', borderColor: 'transparent' }}>
                <FileText size={16} />
                <span>Track Active Requests</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Action / Payment Due Alert */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Payment & Invoices</h3>
            <span className={`badge ${pendingPayments.length > 0 ? 'badge-warning' : 'badge-success'}`}>
              {pendingPayments.length > 0 ? `${pendingPayments.length} PAYMENT DUE` : 'ALL PAID'}
            </span>
          </div>

          {pendingPayments.length > 0 ? (
            <div>
              <div style={{ fontSize: '14px', color: '#b45309', fontWeight: '600', marginBottom: '6px' }}>
                Invoice Pending: ${pendingPayments[0].amount.toFixed(2)} USD
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                Blood units reserved for Request #{pendingPayments[0].requestId?.slice(-6)}. Complete checkout to issue units.
              </p>
              <button
                onClick={() => setSelectedTxn(pendingPayments[0])}
                className="btn btn-primary btn-sm"
                style={{ width: '100%' }}
              >
                <CreditCard size={16} />
                <span>Pay Invoice via Stripe Now</span>
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', marginBottom: '6px' }}>
                <CheckCircle2 size={20} />
                <strong style={{ fontSize: '15px' }}>No Pending Payments</strong>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                All approved requests and processing invoices are current.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <div className="card">
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Total Requests</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>{requests.length}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Submitted to hospital network</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Pending Review</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b' }}>{pendingRequests.length}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Under clinical evaluation</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Approved & Reserved</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#3b82f6' }}>{approvedRequests.length}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Awaiting patient checkout</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Fulfilled & Issued</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981' }}>{fulfilledRequests.length}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Delivered to ward</div>
        </div>
      </div>

      {/* Recent Requests Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '800' }}>Recent Blood Requests</h3>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Live status and unit tracking</p>
          </div>
          <Link href="/patient/new-request" className="btn btn-primary btn-sm">
            + New Request
          </Link>
        </div>

        {requests.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
            No blood requests submitted yet. Click above to create one.
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Hospital Center</th>
                  <th>Blood Group</th>
                  <th>Units</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Action / Payment</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const txn = req.transactions?.[0];

                  return (
                    <tr key={req.requestId}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#64748b' }}>
                          #{req.requestId.slice(-8)}
                        </span>
                      </td>
                      <td>
                        <strong>{req.hospital?.name}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{req.reason}</div>
                      </td>
                      <td>
                        <span className="badge badge-danger">
                          {req.bloodGroup.replace('_', '+')}
                        </span>
                      </td>
                      <td>{req.quantity} Unit(s)</td>
                      <td>
                        <span className={`badge ${req.urgency === 'EMERGENCY' ? 'badge-danger' : req.urgency === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>
                          {req.urgency}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${req.status === 'FULFILLED' ? 'badge-success' : req.status === 'APPROVED' ? 'badge-info' : req.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        {req.status === 'APPROVED' && txn && txn.status === 'PENDING' ? (
                          <button
                            onClick={() => setSelectedTxn(txn)}
                            className="btn btn-primary btn-sm"
                          >
                            <CreditCard size={14} />
                            <span>Pay ${txn.amount.toFixed(2)}</span>
                          </button>
                        ) : req.status === 'FULFILLED' ? (
                          <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                            ✓ Paid & Issued
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>In Review</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedTxn && (
        <PaymentModal
          transaction={selectedTxn}
          onClose={() => setSelectedTxn(null)}
          onSuccess={() => {
            setSelectedTxn(null);
            fetchPatientData();
          }}
        />
      )}
    </DashboardLayout>
  );
}
