'use client';

import React, { useState, useEffect, Suspense } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Clock, Building2, Droplet, CheckCircle2, AlertCircle } from 'lucide-react';

function BookAppointmentForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedHospital = searchParams.get('hospitalId') || '';

  const [hospitals, setHospitals] = useState([]);
  const [hospitalId, setHospitalId] = useState(preselectedHospital);
  const [appointmentDate, setAppointmentDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM');
  const [appointmentType, setAppointmentType] = useState('WHOLE_BLOOD');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/hospitals')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHospitals(data.hospitals || []);
          if (!hospitalId && data.hospitals?.length > 0) {
            setHospitalId(data.hospitals[0].hospitalId);
          }
        }
      });
  }, []);

  const timeSlots = [
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '01:00 PM',
    '02:00 PM',
    '03:30 PM',
    '04:30 PM',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          donorId: user?.donor?.donorId,
          hospitalId,
          appointmentDate,
          appointmentTime,
          appointmentType,
          notes,
        }),
      });


      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to book appointment');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/donor');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: '32px' }}>
      {success ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <CheckCircle2 size={54} color="#10b981" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            Appointment Confirmed!
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Your appointment on {appointmentDate} at {appointmentTime} has been successfully scheduled. A confirmation notification has been sent. Redirecting...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '14px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Hospital Selection */}
          <div className="form-group">
            <label className="form-label">Select Hospital & Blood Bank Center</label>
            <select
              className="form-select"
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
              required
            >
              {hospitals.map((h) => (
                <option key={h.hospitalId} value={h.hospitalId}>
                  {h.name} ({h.address}, {h.city})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Donation Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Appointment Date</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="form-input"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Donation Type</label>
              <select
                className="form-select"
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
              >
                <option value="WHOLE_BLOOD">Whole Blood Donation (450ml)</option>
                <option value="PLATELETS">Platelets (Apheresis)</option>
                <option value="PLASMA">Plasma Donation</option>
                <option value="RED_CELLS">Double Red Cells</option>
              </select>
            </div>
          </div>

          {/* Available Time Slots */}
          <div className="form-group">
            <label className="form-label">Select Available Time Slot</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setAppointmentTime(slot)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: appointmentTime === slot ? '2px solid #dc2626' : '1px solid #e2e8f0',
                    backgroundColor: appointmentTime === slot ? '#fee2e2' : '#ffffff',
                    color: appointmentTime === slot ? '#991b1b' : '#334155',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Special Notes or Dietary Accommodations (Optional)</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Need morning appointment, first-time donor..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
          >
            {loading ? 'Validating Slot & Booking...' : 'Confirm Appointment Booking'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function BookAppointmentPage() {
  return (
    <DashboardLayout>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={24} color="#dc2626" />
            <span>Book Blood Donation Appointment</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Select your preferred partner hospital and schedule a convenient donation slot.
          </p>
        </div>

        <Suspense fallback={<div className="card" style={{ padding: '32px', textAlign: 'center' }}>Loading booking wizard...</div>}>
          <BookAppointmentForm />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
