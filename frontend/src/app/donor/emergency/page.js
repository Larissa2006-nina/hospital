'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, MapPin, CheckCircle, XCircle, Clock, Navigation, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function DonorEmergencyPage() {
  const { user } = useAuth();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);
  const [responseSuccess, setResponseSuccess] = useState(null);

  useEffect(() => {
    fetchEmergencies();
  }, []);

  const fetchEmergencies = async () => {
    try {
      const res = await fetch('/api/emergency?active=true');
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

  const handleResponse = async (emergencyId, status) => {
    setRespondingId(emergencyId);
    try {
      const res = await fetch('/api/emergency', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergencyId,
          donorId: user?.donor?.donorId,
          status, // 'ACCEPTED' or 'DECLINED'
          notes: status === 'ACCEPTED' ? 'Donor accepted alert. Navigating to hospital center.' : 'Unavailable today.',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResponseSuccess(status === 'ACCEPTED' ? 'Thank you! You have accepted the emergency alert. The hospital trauma team has been notified of your response.' : 'Response noted.');
        fetchEmergencies();
      }
    } catch (e) {
      alert('Failed to submit response: ' + e.message);
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <ShieldAlert size={24} color="#dc2626" />
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
            Urgent Emergency Blood Alerts
          </h1>
        </div>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Active hospital emergency broadcasts for compatible blood groups. Your immediate response helps save critical patients in trauma and intensive care.
        </p>
      </div>

      {responseSuccess && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
          <CheckCircle size={20} color="#059669" />
          <span>{responseSuccess}</span>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
          Checking active emergency alerts...
        </div>
      ) : emergencies.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
            No Active Emergency Alerts
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Hospital blood banks currently have stable emergency reserve levels. Thank you for staying on standby!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {emergencies.map((emg) => {
            const hasUserResponded = emg.responses?.some(r => r.donor?.userId === user?.id && r.status === 'ACCEPTED');

            return (
              <div
                key={emg.emergencyId}
                className="card"
                style={{
                  borderLeft: '5px solid #dc2626',
                  boxShadow: '0 8px 24px rgba(220, 38, 38, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      fontWeight: '900',
                      border: '2px solid #fca5a5',
                    }}>
                      {emg.bloodGroup?.replace('_', '+')}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="badge badge-danger">CRITICAL EMERGENCY</span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Issued {new Date(emg.requestDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                        {emg.hospital?.name}
                      </h3>
                      <div style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <MapPin size={14} color="#dc2626" />
                        <span>{emg.hospital?.address}, {emg.hospital?.city}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#dc2626' }}>
                      {emg.quantityNeeded} Units Needed
                    </div>
                    <div style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                      {emg.responses?.filter(r => r.status === 'ACCEPTED').length || 0} Donors Responded
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                  <strong style={{ fontSize: '13px', color: '#334155' }}>Clinical Indication: </strong>
                  <span style={{ fontSize: '13px', color: '#475569' }}>{emg.reason}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <Link
                    href={`/donor/map`}
                    className="btn btn-secondary btn-sm"
                  >
                    <Navigation size={14} color="#2563eb" />
                    <span>View Driving Route on Map</span>
                  </Link>

                  {hasUserResponded ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: '700', fontSize: '14px' }}>
                      <CheckCircle size={18} />
                      <span>You have accepted this alert! Proceed to Hospital.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleResponse(emg.emergencyId, 'DECLINED')}
                        disabled={respondingId === emg.emergencyId}
                        className="btn btn-secondary btn-sm"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleResponse(emg.emergencyId, 'ACCEPTED')}
                        disabled={respondingId === emg.emergencyId}
                        className="btn btn-primary btn-sm"
                        style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}
                      >
                        <CheckCircle size={16} />
                        <span>Accept Emergency Alert & Donate</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
