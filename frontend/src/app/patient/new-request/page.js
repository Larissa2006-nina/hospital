'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Heart, Building2, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

export default function NewBloodRequestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [hospitals, setHospitals] = useState([]);
  const [hospitalId, setHospitalId] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O_POS');
  const [quantity, setQuantity] = useState(1);
  const [urgency, setUrgency] = useState('MEDIUM');
  const [reason, setReason] = useState('');
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
          if (data.hospitals?.length > 0) {
            setHospitalId(data.hospitals[0].hospitalId);
          }
        }
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/blood-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: user?.patient?.patientId,
          hospitalId,
          bloodGroup,
          quantity,
          urgency,
          reason,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit blood request');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/patient/requests');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Heart size={24} color="#dc2626" />
            <span>Submit Clinical Blood Request</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Request whole blood, platelets, or plasma units from partner hospital blood banks.
          </p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <CheckCircle2 size={54} color="#10b981" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                Blood Request Successfully Submitted!
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b' }}>
                The hospital blood bank and hematology team have been notified to review stock and reserve requested units. Redirecting to tracker...
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

              <div className="form-group">
                <label className="form-label">Destination Hospital & Blood Bank</label>
                <select
                  className="form-select"
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  required
                >
                  {hospitals.map((h) => (
                    <option key={h.hospitalId} value={h.hospitalId}>
                      {h.name} - {h.address}, {h.city} (Stock: {h.bloodBank?.availableUnitsCount || 0} units)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Required Blood Group</label>
                  <select
                    className="form-select"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                  >
                    <option value="O_POS">O+ (O Positive)</option>
                    <option value="O_NEG">O- (O Negative Universal)</option>
                    <option value="A_POS">A+ (A Positive)</option>
                    <option value="A_NEG">A- (A Negative)</option>
                    <option value="B_POS">B+ (B Positive)</option>
                    <option value="B_NEG">B- (B Negative)</option>
                    <option value="AB_POS">AB+ (AB Positive)</option>
                    <option value="AB_NEG">AB- (AB Negative)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity Needed (Units)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="form-input"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Urgency</label>
                <select
                  className="form-select"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                >
                  <option value="LOW">LOW - Routine Elective / Transfusion Therapy</option>
                  <option value="MEDIUM">MEDIUM - Scheduled Surgery / Next 24 Hours</option>
                  <option value="HIGH">HIGH - Urgent Surgical / Inpatient Acute Care</option>
                  <option value="EMERGENCY">EMERGENCY - Critical Resuscitation</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Diagnosis / Clinical Reason for Transfusion</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Scheduled coronary bypass surgery at Metro General..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Attending Physician or Ward Details (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dr. Vance, Ward 4B"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                {loading ? 'Submitting Clinical Request...' : 'Submit Blood Request to Hospital'}
              </button>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
