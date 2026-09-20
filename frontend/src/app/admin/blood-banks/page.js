'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Droplet, Building2, Package, ShieldCheck } from 'lucide-react';

export default function AdminBloodBanksPage() {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blood-bank/inventory')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setInventory(data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Droplet size={24} color="#dc2626" />
          <span>Regional Blood Bank Inventories & Storage Overview</span>
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Global inventory audit across all hospital blood repositories, cold vault racks, and screening states.
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading inventory...</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unit ID</th>
                  <th>Hospital & BloodBank</th>
                  <th>Blood Group</th>
                  <th>Component</th>
                  <th>Quantity</th>
                  <th>Storage Vault</th>
                  <th>Expiry Date</th>
                  <th>Lab Test Status</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory?.units?.map((u) => (
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
                        {u.bloodGroup.replace('_', '+')}
                      </span>
                    </td>
                    <td>{u.componentType}</td>
                    <td>{u.quantity} ml</td>
                    <td>{u.storageLocation}</td>
                    <td>{new Date(u.expiryDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${u.testStatus === 'PASSED' ? 'badge-success' : u.testStatus === 'FAILED' ? 'badge-danger' : 'badge-warning'}`}>
                        {u.testStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'AVAILABLE' ? 'badge-success' : u.status === 'TESTING' ? 'badge-warning' : 'badge-neutral'}`}>
                        {u.status}
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
