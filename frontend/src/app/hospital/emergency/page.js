'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Plus, Users, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import EmergencyModal from '@/components/EmergencyModal';

export default function HospitalEmergencyPage() {
  const { user } = useAuth();
  const [emergencies, setEmergencies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const hospital = user?.hospital;

  useEffect(() => {
    fetchEmergencies();
  }, []);

  const fetchEmergencies = async () => {
    try {
      const res = await fetch('/api/emergency');
      const data = await res.json();
      if (data.success) {
        setEmergencies(data.emergencies || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkFulfilled = async (emergencyId) => {
    try {
      const res = await fetch('/api/emergency', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyId, status: 'FULFILLED' }),
      });
      if (res.ok) {
        alert('Emergency request marked as FULFILLED!');
        fetchEmergencies();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={24} color="#dc2626" />
            <span>Emergency Blood Request Hub & Dispatch</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Trigger urgent blood stock audits, broadcast push notifications to eligible donors, and track live response rates.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
          style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}
        >
          <Plus size={16} />
          <span>New Emergency Request</span>
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading emergency broadcasts...</div>
        ) : emergencies.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            No emergency requests logged.
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Emergency ID</th>
                  <th>Blood Group</th>
                  <th>Units Needed</th>
                  <th>Clinical Reason</th>
                  <th>Required By</th>
                  <th>Donor Responses</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {emergencies.map((emg) => {
                  const acceptedCount = emg.responses?.filter(r => r.status === 'ACCEPTED').length || 0;

                  return (
                    <tr key={emg.emergencyId}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#dc2626' }}>
                          #{emg.emergencyId.slice(-8)}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-danger">
                          {emg.bloodGroup.replace('_', '+')}
                        </span>
                      </td>
                      <td><strong>{emg.quantityNeeded} Units</strong></td>
                      <td>
                        <span style={{ fontSize: '13px', color: '#475569' }}>{emg.reason}</span>
                      </td>
                      <td>{new Date(emg.requiredDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={16} color="#059669" />
                          <strong style={{ color: '#059669' }}>{acceptedCount} Accepted</strong>
                        </div>
                        {acceptedCount > 0 && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {emg.responses.filter(r => r.status === 'ACCEPTED').map(r => r.donor?.user?.name).join(', ')}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${emg.status === 'FULFILLED' ? 'badge-success' : emg.status === 'DONORS_RESPONDING' ? 'badge-info' : 'badge-danger'}`}>
                          {emg.status}
                        </span>
                      </td>
                      <td>
                        {emg.status !== 'FULFILLED' && (
                          <button
                            onClick={() => handleMarkFulfilled(emg.emergencyId)}
                            className="btn btn-secondary btn-sm"
                          >
                            <CheckCircle size={14} color="#059669" />
                            <span>Mark Fulfilled</span>
                          </button>
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

      {showModal && (
        <EmergencyModal
          hospitalId={hospital?.hospitalId}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchEmergencies();
          }}
        />
      )}
    </DashboardLayout>
  );
}
