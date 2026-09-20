'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { FlaskConical, Droplet, ShieldCheck, AlertTriangle, CheckCircle2, ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';
import LabTestModal from '@/components/LabTestModal';

export default function LabDashboard() {
  const { user } = useAuth();
  const [labData, setLabData] = useState({
    pendingCount: 0,
    approvedCount: 0,
    discardedCount: 0,
    units: [],
  });
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLabUnits();
  }, [user]);

  const fetchLabUnits = async () => {
    try {
      const res = await fetch('/api/lab/tests');
      if (res.ok) {
        const data = await res.json();
        setLabData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const pendingUnits = labData.units.filter(u => u.status === 'TESTING');

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '24px', marginBottom: '32px' }}>
        <div className="card" style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          color: '#ffffff',
          padding: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#c7d2fe', marginBottom: '12px' }}>
              Immunohematology & Serology Laboratory
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', color: '#ffffff' }}>
              Welcome, {user?.name || 'Lab Technician'}!
            </h1>
            <p style={{ color: '#c7d2fe', fontSize: '14px', maxWidth: '480px', lineHeight: '1.5' }}>
              Screen collected blood units for HIV, Hepatitis B/C, Syphilis, confirm verified ABO/Rh blood groups, and authorize release into Blood Bank stock.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <Link href="/lab/testing" className="btn btn-primary btn-sm" style={{ background: '#4f46e5' }}>
                <FlaskConical size={16} />
                <span>Open Testing Queue ({pendingUnits.length} Units)</span>
              </Link>
              <Link href="/lab/reports" className="btn btn-secondary btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', borderColor: 'transparent' }}>
                <Activity size={16} />
                <span>Compliance Reports</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quarantine Status */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Quarantine Queue</h3>
            <span className={`badge ${pendingUnits.length > 0 ? 'badge-warning' : 'badge-success'}`}>
              {pendingUnits.length > 0 ? `${pendingUnits.length} AWAITING SCREENING` : 'ALL CLEARED'}
            </span>
          </div>

          {pendingUnits.length > 0 ? (
            <div>
              <div style={{ fontSize: '14px', color: '#b45309', fontWeight: '600', marginBottom: '6px' }}>
                Unit #{pendingUnits[0].bloodUnitId.slice(-6)} ({pendingUnits[0].bloodGroup.replace('_', '+')}) ready for testing
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                Collected from {pendingUnits[0].bloodDonation?.donor?.user?.name || 'Recent Donor'}.
              </p>
              <button
                onClick={() => setSelectedUnit(pendingUnits[0])}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', background: '#4f46e5' }}
              >
                <FlaskConical size={16} />
                <span>Screen This Unit Now</span>
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', marginBottom: '6px' }}>
                <CheckCircle2 size={20} />
                <strong style={{ fontSize: '15px' }}>Quarantine Empty</strong>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                All collected blood units have been fully screened and approved.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <div className="card">
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Total Screened</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>{labData.units.length}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Collected units processed</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Awaiting Testing</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b' }}>{labData.pendingCount}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>In quarantine rack</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Approved in Stock</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#059669' }}>{labData.approvedCount}</div>
          <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>Released to BloodBank</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Discarded / Biohazard</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#dc2626' }}>{labData.discardedCount}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Failed serology tests</div>
        </div>
      </div>

      {/* Quarantine Testing Queue Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '800' }}>Units Awaiting Laboratory Screening</h3>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Pathogen panel & ABO/Rh confirmation</p>
          </div>
          <Link href="/lab/testing" className="btn btn-secondary btn-sm">
            View All Testing Queue
          </Link>
        </div>

        {pendingUnits.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
            No blood units currently awaiting testing.
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unit ID</th>
                  <th>Component</th>
                  <th>Blood Group</th>
                  <th>Collection Date</th>
                  <th>Storage Rack</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingUnits.map((unit) => (
                  <tr key={unit.bloodUnitId}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>
                        #{unit.bloodUnitId.slice(-8)}
                      </span>
                    </td>
                    <td>{unit.componentType} ({unit.quantity}ml)</td>
                    <td>
                      <span className="badge badge-danger">
                        {unit.bloodGroup.replace('_', '+')}
                      </span>
                    </td>
                    <td>{new Date(unit.collectionDate).toLocaleDateString()}</td>
                    <td>{unit.storageLocation}</td>
                    <td>
                      <span className="badge badge-warning">
                        TESTING / PENDING
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedUnit(unit)}
                        className="btn btn-primary btn-sm"
                        style={{ background: '#4f46e5' }}
                      >
                        <FlaskConical size={14} />
                        <span>Perform Screening Tests</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Laboratory Test Modal */}
      {selectedUnit && (
        <LabTestModal
          unit={selectedUnit}
          onClose={() => setSelectedUnit(null)}
          onSuccess={() => {
            setSelectedUnit(null);
            fetchLabUnits();
          }}
        />
      )}
    </DashboardLayout>
  );
}
