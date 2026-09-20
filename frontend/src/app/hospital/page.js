'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  Droplet,
  Heart,
  Calendar,
  AlertTriangle,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldAlert,
  FlaskConical,
} from 'lucide-react';
import Link from 'next/link';
import EmergencyModal from '@/components/EmergencyModal';

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const hospital = user?.hospital;

  useEffect(() => {
    fetchHospitalData();
  }, [user]);

  const fetchHospitalData = async () => {
    try {
      const [invRes, apptRes, reqRes, emgRes, txRes] = await Promise.all([
        fetch('/api/blood-bank/inventory'),
        fetch('/api/appointments'),
        fetch('/api/blood-requests'),
        fetch('/api/emergency'),
        fetch('/api/payments'),
      ]);

      if (invRes.ok) setInventory(await invRes.json());
      if (apptRes.ok) setAppointments((await apptRes.json()).appointments || []);
      if (reqRes.ok) setRequests((await reqRes.json()).requests || []);
      if (emgRes.ok) setEmergencies((await emgRes.json()).emergencies || []);
      if (txRes.ok) setTransactions((await txRes.json()).transactions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordDonation = async (appt) => {
    const confirmDonation = confirm(`Record Blood Donation for ${appt.donor?.user?.name} (${appt.donor?.bloodGroup.replace('_', '+')}) and route unit to Lab for screening?`);
    if (!confirmDonation) return;

    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorId: appt.donorId,
          hospitalId: appt.hospitalId,
          appointmentId: appt.appointmentId,
          bloodGroup: appt.donor.bloodGroup,
          quantity: 450,
          donationType: appt.appointmentType || 'WHOLE_BLOOD',
          notes: 'Routine collection completed at hospital ward.',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record donation');

      alert('Blood donation recorded! Unit #' + data.bloodUnit.bloodUnitId.slice(-6) + ' has been routed to the Laboratory Testing queue.');
      fetchHospitalData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleProcessRequest = async (requestId, action) => {
    try {
      const res = await fetch('/api/blood-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Processing failed');

      alert(data.message || 'Request processed');
      fetchHospitalData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const bloodGroups = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'];
  const stockByGroup = inventory?.stockByGroup || {};
  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const activeEmergencies = emergencies.filter(e => e.status !== 'FULFILLED' && e.status !== 'CANCELLED');

  return (
    <DashboardLayout>
      {/* Hospital Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '24px', marginBottom: '32px' }}>
        <div className="card" style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', color: '#fca5a5', fontWeight: '600', marginBottom: '12px' }}>
              <Building2 size={14} color="#ef4444" />
              <span>{hospital?.name || 'Metro General Hospital'}</span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', color: '#ffffff' }}>
              Hospital Blood Bank Command Center
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '480px', lineHeight: '1.5' }}>
              Real-time monitoring of available blood units, donor appointments, quarantine laboratory routing, and emergency blood broadcast dispatch.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => setShowEmergencyModal(true)}
                className="btn btn-primary btn-sm"
                style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}
              >
                <ShieldAlert size={16} />
                <span>Trigger Emergency Blood Request</span>
              </button>
              <Link href="/hospital/blood-bank" className="btn btn-secondary btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', borderColor: 'transparent' }}>
                <Droplet size={16} />
                <span>Manage Blood Bank</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Emergency Alert Status Box */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Emergency Dispatch</h3>
            <span className={`badge ${activeEmergencies.length > 0 ? 'badge-danger' : 'badge-success'}`}>
              {activeEmergencies.length > 0 ? `${activeEmergencies.length} ACTIVE ALERTS` : 'NORMAL STANDBY'}
            </span>
          </div>

          {activeEmergencies.length > 0 ? (
            <div>
              <div style={{ fontSize: '14px', color: '#991b1b', fontWeight: '700', marginBottom: '4px' }}>
                🚨 {activeEmergencies[0].quantityNeeded} Units {activeEmergencies[0].bloodGroup?.replace('_', '+')} Requested
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                {activeEmergencies[0].responses?.filter(r => r.status === 'ACCEPTED').length || 0} Donors responding now.
              </p>
              <Link href="/hospital/emergency" className="btn btn-danger btn-sm" style={{ width: '100%' }}>
                View Emergency Hub &rarr;
              </Link>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', marginBottom: '6px' }}>
                <CheckCircle2 size={20} />
                <strong style={{ fontSize: '15px' }}>Stock Reserves Stable</strong>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                No active emergency broadcasts. Blood bank reserves meet trauma minimums.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Live BloodBank Stock Grid by Blood Group */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
              Live Blood Bank Inventory Stock (By Group)
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Real-time available units screened and verified by Laboratory
            </p>
          </div>
          <Link href="/hospital/blood-bank" className="btn btn-secondary btn-sm">
            Detailed Inventory &rarr;
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '12px' }}>
          {bloodGroups.map((bg) => {
            const stock = stockByGroup[bg] || { available: 0, testing: 0, isLowStock: false };
            const isLow = stock.available < 2;

            return (
              <div
                key={bg}
                style={{
                  border: isLow ? '2px solid #ef4444' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 10px',
                  textAlign: 'center',
                  background: isLow ? '#fef2f2' : '#ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{
                  fontSize: '18px',
                  fontWeight: '900',
                  color: isLow ? '#dc2626' : '#0f172a',
                  marginBottom: '4px',
                }}>
                  {bg.replace('_', '+')}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: isLow ? '#dc2626' : '#059669' }}>
                  {stock.available}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                  Units Available
                </div>
                {isLow ? (
                  <span className="badge badge-danger" style={{ fontSize: '10px', padding: '2px 6px' }}>
                    LOW STOCK
                  </span>
                ) : (
                  <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px' }}>
                    ADEQUATE
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2 Key Workflows Queues: Appointments & Patient Requests */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Donor Appointments & Collection Queue */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Donor Appointments Queue</h3>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Check in donors & collect blood</div>
            </div>
            <Link href="/hospital/appointments" className="btn btn-secondary btn-sm">
              All ({appointments.length})
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              No appointments scheduled.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {appointments.slice(0, 4).map((appt) => (
                <div
                  key={appt.appointmentId}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                      {appt.donor?.user?.name}
                    </strong>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Group: <span style={{ color: '#dc2626', fontWeight: '700' }}>{appt.donor?.bloodGroup.replace('_', '+')}</span> &bull; {new Date(appt.appointmentDate).toLocaleDateString()} at {appt.appointmentTime}
                    </div>
                  </div>

                  {appt.status === 'CONFIRMED' ? (
                    <button
                      onClick={() => handleRecordDonation(appt)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '12px' }}
                    >
                      <Droplet size={14} />
                      <span>Collect & Route to Lab</span>
                    </button>
                  ) : (
                    <span className="badge badge-success">
                      {appt.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Patient Blood Requests Processor */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Patient Blood Requests</h3>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Review & reserve Blood Bank units</div>
            </div>
            <Link href="/hospital/requests" className="btn btn-secondary btn-sm">
              All ({requests.length})
            </Link>
          </div>

          {requests.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              No active blood requests.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {requests.slice(0, 4).map((req) => (
                <div
                  key={req.requestId}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                      {req.patient?.user?.name} ({req.quantity} Units {req.bloodGroup.replace('_', '+')})
                    </strong>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Reason: {req.reason} &bull; <span className="badge badge-warning" style={{ fontSize: '10px' }}>{req.urgency}</span>
                    </div>
                  </div>

                  {req.status === 'PENDING' ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleProcessRequest(req.requestId, 'APPROVE')}
                        className="btn btn-success btn-sm"
                        style={{ fontSize: '11px' }}
                      >
                        Approve & Reserve
                      </button>
                      <button
                        onClick={() => handleProcessRequest(req.requestId, 'REJECT')}
                        className="btn btn-danger btn-sm"
                        style={{ fontSize: '11px' }}
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <span className="badge badge-success">
                      {req.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Emergency Request Modal */}
      {showEmergencyModal && (
        <EmergencyModal
          hospitalId={hospital?.hospitalId}
          onClose={() => setShowEmergencyModal(false)}
          onSuccess={() => {
            setShowEmergencyModal(false);
            fetchHospitalData();
          }}
        />
      )}
    </DashboardLayout>
  );
}
