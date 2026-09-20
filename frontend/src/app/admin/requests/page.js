'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FileText, Heart, CreditCard } from 'lucide-react';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blood-requests')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRequests(data.requests || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Heart size={24} color="#dc2626" />
          <span>System-Wide Clinical Blood Requests</span>
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Master log of all patient blood requests, urgency triage, hospital allocations, and transaction statuses.
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading requests...</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Patient Name</th>
                  <th>Hospital</th>
                  <th>Blood Group</th>
                  <th>Units</th>
                  <th>Urgency</th>
                  <th>Clinical Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.requestId}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>#{r.requestId.slice(-8)}</span>
                    </td>
                    <td><strong>{r.patient?.user?.name}</strong></td>
                    <td>{r.hospital?.name}</td>
                    <td><span className="badge badge-danger">{r.bloodGroup.replace('_', '+')}</span></td>
                    <td>{r.quantity} Unit(s)</td>
                    <td><span className="badge badge-warning">{r.urgency}</span></td>
                    <td><span style={{ fontSize: '13px', color: '#475569' }}>{r.reason}</span></td>
                    <td>
                      <span className={`badge ${r.status === 'FULFILLED' ? 'badge-success' : r.status === 'APPROVED' ? 'badge-info' : r.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                        {r.status}
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
