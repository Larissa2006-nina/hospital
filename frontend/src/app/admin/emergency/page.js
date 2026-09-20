'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ShieldAlert, Users, CheckCircle } from 'lucide-react';

export default function AdminEmergencyPage() {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/emergency')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEmergencies(data.emergencies || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={24} color="#dc2626" />
          <span>Emergency Blood Broadcasts Oversight</span>
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Real-time tracking of regional emergency blood requests and donor response rates.
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading emergencies...</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Emergency ID</th>
                  <th>Hospital</th>
                  <th>Blood Group</th>
                  <th>Units Needed</th>
                  <th>Clinical Reason</th>
                  <th>Donor Responses</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {emergencies.map((e) => (
                  <tr key={e.emergencyId}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#dc2626' }}>
                        #{e.emergencyId.slice(-8)}
                      </span>
                    </td>
                    <td><strong>{e.hospital?.name}</strong></td>
                    <td><span className="badge badge-danger">{e.bloodGroup.replace('_', '+')}</span></td>
                    <td><strong>{e.quantityNeeded} Units</strong></td>
                    <td><span style={{ fontSize: '13px', color: '#475569' }}>{e.reason}</span></td>
                    <td>
                      <span style={{ color: '#059669', fontWeight: '700' }}>
                        {e.responses?.filter(r => r.status === 'ACCEPTED').length || 0} Donors Accepted
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${e.status === 'FULFILLED' ? 'badge-success' : 'badge-danger'}`}>
                        {e.status}
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
