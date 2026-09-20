'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Droplet, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function HospitalAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordDonation = async (appt) => {
    const confirmAction = confirm(`Record donation collection for ${appt.donor?.user?.name} (${appt.donor?.bloodGroup.replace('_', '+')}) and generate a Blood Unit in quarantine for laboratory screening?`);
    if (!confirmAction) return;

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
          donationType: appt.appointmentType,
          notes: 'Standard collection completed.',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record donation');

      alert(`Donation recorded! Blood Unit #${data.bloodUnit.bloodUnitId.slice(-6)} has been routed to the Laboratory Testing queue.`);
      fetchAppointments();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={24} color="#dc2626" />
          <span>Donor Appointments & Phlebotomy Queue</span>
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Check in arriving blood donors, perform clinical triage, and collect blood units for laboratory testing.
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            No appointments on schedule.
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Appointment ID</th>
                  <th>Donor Name & Contact</th>
                  <th>Blood Group</th>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Notes</th>
                  <th>Status</th>
                  <th>Phlebotomy Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.appointmentId}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>
                        #{appt.appointmentId.slice(-8)}
                      </span>
                    </td>
                    <td>
                      <strong>{appt.donor?.user?.name}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{appt.donor?.user?.phone || appt.donor?.user?.email}</div>
                    </td>
                    <td>
                      <span className="badge badge-danger">
                        {appt.donor?.bloodGroup.replace('_', '+')}
                      </span>
                    </td>
                    <td>
                      <div>{new Date(appt.appointmentDate).toLocaleDateString()}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{appt.appointmentTime}</div>
                    </td>
                    <td>{appt.appointmentType}</td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{appt.notes || 'Routine donation'}</span>
                    </td>
                    <td>
                      <span className={`badge ${appt.status === 'COMPLETED' ? 'badge-success' : appt.status === 'CONFIRMED' ? 'badge-info' : 'badge-neutral'}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td>
                      {appt.status === 'CONFIRMED' ? (
                        <button
                          onClick={() => handleRecordDonation(appt)}
                          className="btn btn-primary btn-sm"
                        >
                          <Droplet size={14} />
                          <span>Collect Blood & Route to Lab</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                          ✓ Blood Collected & Tested
                        </span>
                      )}
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
