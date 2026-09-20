'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Heart, CreditCard, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import PaymentModal from '@/components/PaymentModal';

export default function PatientRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/blood-requests');
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
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
            <FileText size={24} color="#dc2626" />
            <span>My Blood Requests Tracker</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Live status of your submitted blood requests and hospital blood unit allocations.
          </p>
        </div>
        <Link href="/patient/new-request" className="btn btn-primary">
          <Heart size={16} />
          <span>Submit New Request</span>
        </Link>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading requests...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Heart size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
              No Blood Requests Found
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
              Submit a request to source blood units from the hospital network.
            </p>
            <Link href="/patient/new-request" className="btn btn-primary">
              Submit Blood Request
            </Link>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Hospital</th>
                  <th>Blood Group</th>
                  <th>Quantity</th>
                  <th>Urgency</th>
                  <th>Submitted Date</th>
                  <th>Status</th>
                  <th>Action</th>
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
                      <td>{new Date(req.requestDate).toLocaleDateString()}</td>
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
                            ✓ Blood Units Issued
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Evaluating Stock</span>
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

      {selectedTxn && (
        <PaymentModal
          transaction={selectedTxn}
          onClose={() => setSelectedTxn(null)}
          onSuccess={() => {
            setSelectedTxn(null);
            fetchRequests();
          }}
        />
      )}
    </DashboardLayout>
  );
}
