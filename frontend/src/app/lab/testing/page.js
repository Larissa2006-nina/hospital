'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { FlaskConical, ShieldAlert, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import LabTestModal from '@/components/LabTestModal';

export default function LabTestingQueuePage() {
  const { user } = useAuth();
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestingQueue();
  }, []);

  const fetchTestingQueue = async () => {
    try {
      const res = await fetch('/api/lab/tests?status=TESTING');
      const data = await res.json();
      if (data.success) {
        setUnits(data.units || []);
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
            <FlaskConical size={24} color="#4f46e5" />
            <span>Laboratory Testing Queue</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Quarantine blood units awaiting viral screening (HIV, HBV, HCV, Syphilis) and immunohematology typing.
          </p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading quarantine units...</div>
        ) : units.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
              No Units Awaiting Testing
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              All collected units have been screened and approved for Blood Bank inventory.
            </p>
          </div>
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
                  <th>Collection Date</th>
                  <th>Quarantine Location</th>
                  <th>Action</th>
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
                        {u.bloodGroup.replace('_', '+')}
                      </span>
                    </td>
                    <td>{u.componentType}</td>
                    <td>{u.quantity} ml</td>
                    <td>{new Date(u.collectionDate).toLocaleDateString()}</td>
                    <td>{u.storageLocation}</td>
                    <td>
                      <button
                        onClick={() => setSelectedUnit(u)}
                        className="btn btn-primary btn-sm"
                        style={{ background: '#4f46e5' }}
                      >
                        <FlaskConical size={14} />
                        <span>Perform Screening</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUnit && (
        <LabTestModal
          unit={selectedUnit}
          onClose={() => setSelectedUnit(null)}
          onSuccess={() => {
            setSelectedUnit(null);
            fetchTestingQueue();
          }}
        />
      )}
    </DashboardLayout>
  );
}
