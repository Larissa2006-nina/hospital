'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Droplet, Building2, CheckCircle } from 'lucide-react';

export default function LabApprovedPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lab/tests?status=AVAILABLE')
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
          <ShieldCheck size={24} color="#059669" />
          <span>Approved Blood Units Repository</span>
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Blood units that have passed full serological screening and are actively stored in hospital blood banks.
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading approved units...</div>
        ) : units.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            No approved units found.
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unit ID</th>
                  <th>Hospital BloodBank</th>
                  <th>Verified Blood Group</th>
                  <th>Component</th>
                  <th>Screening Panel</th>
                  <th>Storage Location</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.bloodUnitId}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>
                        #{u.bloodUnitId.slice(-8)}
                      </span>
                    </td>
                    <td>
                      <strong>{u.bloodBank?.hospital?.name}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{u.bloodBank?.name}</div>
                    </td>
                    <td>
                      <span className="badge badge-danger">
                        {(u.verifiedGroup || u.bloodGroup).replace('_', '+')}
                      </span>
                    </td>
                    <td>{u.componentType} ({u.quantity}ml)</td>
                    <td>
                      <div style={{ fontSize: '11px', color: '#059669' }}>
                        HIV: NEG &bull; HBV: NEG &bull; HCV: NEG &bull; Syphilis: NEG
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                        {u.storageLocation}
                      </span>
                    </td>
                    <td>{new Date(u.expiryDate).toLocaleDateString()}</td>
                    <td>
                      <span className="badge badge-success">
                        AVAILABLE IN STOCK
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
