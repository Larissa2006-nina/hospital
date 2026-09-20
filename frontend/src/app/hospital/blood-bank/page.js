'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Droplet, AlertTriangle, ShieldCheck, Plus, Package } from 'lucide-react';
import Link from 'next/link';

export default function HospitalBloodBankPage() {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/blood-bank/inventory');
      const data = await res.json();
      if (data.success) {
        setInventory(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredUnits = inventory?.units?.filter(u => {
    if (filterGroup !== 'ALL' && u.bloodGroup !== filterGroup) return false;
    if (filterStatus !== 'ALL' && u.status !== filterStatus) return false;
    return true;
  }) || [];

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Droplet size={24} color="#dc2626" />
            <span>Hospital Blood Bank Inventory</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Full chain-of-custody storage, component types, expiry dates, and laboratory test verifications.
          </p>
        </div>
      </div>

      {/* Component & Status Analytics */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Available Screened Units</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#059669' }}>
            {inventory?.stockByStatus?.AVAILABLE || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>Ready for transfusion</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>In Lab Testing Quarantine</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#f59e0b' }}>
            {inventory?.stockByStatus?.TESTING || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Awaiting serology clearance</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Reserved for Patients</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#3b82f6' }}>
            {inventory?.stockByStatus?.RESERVED || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Allocated to approved requests</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Total Collected Volume</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>
            {((inventory?.totalUnitsCount || 0) * 450 / 1000).toFixed(1)} L
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>In hospital repository</div>
        </div>
      </div>

      {/* Filter Toolbar & Data Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginRight: '6px' }}>Blood Group:</span>
              <select
                className="form-select"
                style={{ width: 'auto', display: 'inline-block', padding: '6px 12px' }}
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
              >
                <option value="ALL">All Blood Groups</option>
                <option value="A_POS">A+</option>
                <option value="A_NEG">A-</option>
                <option value="B_POS">B+</option>
                <option value="B_NEG">B-</option>
                <option value="AB_POS">AB+</option>
                <option value="AB_NEG">AB-</option>
                <option value="O_POS">O+</option>
                <option value="O_NEG">O- (Universal)</option>
              </select>
            </div>

            <div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginRight: '6px' }}>Status:</span>
              <select
                className="form-select"
                style={{ width: 'auto', display: 'inline-block', padding: '6px 12px' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">AVAILABLE (In Stock)</option>
                <option value="TESTING">TESTING (Quarantine)</option>
                <option value="RESERVED">RESERVED</option>
                <option value="ISSUED">ISSUED</option>
                <option value="DISCARDED">DISCARDED</option>
              </select>
            </div>
          </div>

          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Showing <strong>{filteredUnits.length}</strong> of {inventory?.totalUnitsCount || 0} blood units
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading inventory...</div>
        ) : filteredUnits.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
            No blood units match the selected filters.
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unit ID</th>
                  <th>Blood Group</th>
                  <th>Component</th>
                  <th>Quantity</th>
                  <th>Collection Date</th>
                  <th>Expiry Date</th>
                  <th>Storage Location</th>
                  <th>Lab Screening</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnits.map((u) => (
                  <tr key={u.bloodUnitId}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>
                        #{u.bloodUnitId.slice(-8)}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-danger">
                        {u.bloodGroup.replace('_', '+')}
                      </span>
                    </td>
                    <td>{u.componentType}</td>
                    <td>{u.quantity} ml</td>
                    <td>{new Date(u.collectionDate).toLocaleDateString()}</td>
                    <td>{new Date(u.expiryDate).toLocaleDateString()}</td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#334155' }}>
                        {u.storageLocation}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.testStatus === 'PASSED' ? 'badge-success' : u.testStatus === 'FAILED' ? 'badge-danger' : 'badge-warning'}`}>
                        {u.testStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'AVAILABLE' ? 'badge-success' : u.status === 'TESTING' ? 'badge-warning' : u.status === 'RESERVED' ? 'badge-info' : 'badge-neutral'}`}>
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
