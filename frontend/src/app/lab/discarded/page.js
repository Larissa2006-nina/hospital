'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AlertTriangle, Trash2, XCircle } from 'lucide-react';

export default function LabDiscardedPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lab/tests?status=DISCARDED')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUnits(data.units || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Trash2 size={24} color="#dc2626" />
          <span>Discarded & Biohazard Blood Units Log</span>
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Mandatory compliance log of blood units discarded due to infectious serology reactivity or sample integrity failure.
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading biohazard log...</div>
        ) : units.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <XCircle size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
              Zero Discarded Units
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              All collected units have met safety standards.
            </p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unit ID</th>
                  <th>Hospital</th>
                  <th>Blood Group</th>
                  <th>Component</th>
                  <th>Screening Observations</th>
                  <th>Tested Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.bloodUnitId}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#dc2626' }}>
                        #{u.bloodUnitId.slice(-8)}
                      </span>
                    </td>
                    <td>{u.bloodBank?.hospital?.name}</td>
                    <td>{u.bloodGroup?.replace('_', '+')}</td>
                    <td>{u.componentType}</td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#b91c1c' }}>
                        {u.testNotes || 'Positive serological test screening'}
                      </span>
                    </td>
                    <td>{u.testedAt ? new Date(u.testedAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className="badge badge-danger">
                        DISCARDED / BIOHAZARD
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
