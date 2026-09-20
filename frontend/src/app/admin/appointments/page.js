'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Calendar, Droplet, CheckCircle } from 'lucide-react';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/appointments')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAppointments(data.appointments || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={24} color="#dc2626" />
          <span>All Scheduled Donor Appointments</span>
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Regional schedule of blood donation appointments across all partner medical facilities.
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading appointments...</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Appointment ID</th>
                  <th>Donor Name</th>
                  <th>Hospital</th>
                  <th>Blood Group</th>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.appointmentId}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>#{a.appointmentId.slice(-8)}</span>
                    </td>
                    <td><strong>{a.donor?.user?.name}</strong></td>
                    <td>{a.hospital?.name}</td>
                    <td><span className="badge badge-danger">{a.donor?.bloodGroup.replace('_', '+')}</span></td>
                    <td>{new Date(a.appointmentDate).toLocaleDateString()} at {a.appointmentTime}</td>
                    <td>{a.appointmentType}</td>
                    <td>
                      <span className={`badge ${a.status === 'COMPLETED' ? 'badge-success' : a.status === 'CONFIRMED' ? 'badge-info' : 'badge-neutral'}`}>
                        {a.status}
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
