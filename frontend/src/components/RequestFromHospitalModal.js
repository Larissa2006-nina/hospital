'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Droplet, AlertTriangle, X, Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function RequestFromHospitalModal({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);

  const [targetHospitalId, setTargetHospitalId] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O_POS');
  const [quantity, setQuantity] = useState(1);
  const [urgency, setUrgency] = useState('HIGH');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const res = await apiFetch('/hospitals');
      const data = await res.json();
      if (data.success) {
        // Filter out own hospital if user is logged in as a hospital
        const filtered = (data.hospitals || []).filter(
          h => !user?.hospitalId || h.hospitalId !== user.hospitalId
        );
        setHospitals(filtered);
        if (filtered.length > 0) {
          setTargetHospitalId(filtered[0].hospitalId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHospitals(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch('/blood-requests', {
        method: 'POST',
        body: JSON.stringify({
          hospitalId: targetHospitalId,
          requestType: 'HOSPITAL_TRANSFER',
          bloodGroup,
          quantity,
          urgency,
          reason,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit transfer request');
      }

      alert(data.message || 'Inter-hospital blood request submitted successfully!');
      if (onSuccess) onSuccess(data.request);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        maxWidth: '540px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={22} color="#ef4444" />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Inter-Hospital Blood Transfer</h3>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Request inventory stock from a partner hospital blood bank</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Target Hospital */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Target Hospital Blood Bank</label>
              {loadingHospitals ? (
                <div style={{ fontSize: '13px', color: '#64748b' }}>Loading regional blood banks...</div>
              ) : (
                <select
                  className="form-input"
                  value={targetHospitalId}
                  onChange={(e) => setTargetHospitalId(e.target.value)}
                  required
                >
                  {hospitals.map((h) => (
                    <option key={h.hospitalId} value={h.hospitalId}>
                      {h.name} — {h.city} ({h.bloodBank?.name || 'Blood Bank'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Blood Group & Quantity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Required Blood Group</label>
                <select
                  className="form-input"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  required
                >
                  <option value="A_POS">A+ (A Positive)</option>
                  <option value="A_NEG">A- (A Negative)</option>
                  <option value="B_POS">B+ (B Positive)</option>
                  <option value="B_NEG">B- (B Negative)</option>
                  <option value="AB_POS">AB+ (AB Positive)</option>
                  <option value="AB_NEG">AB- (AB Negative)</option>
                  <option value="O_POS">O+ (O Positive)</option>
                  <option value="O_NEG">O- (O Negative)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="form-input"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Urgency */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Urgency Level</label>
              <select
                className="form-input"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                required
              >
                <option value="LOW">Low — Routine Resupply</option>
                <option value="MEDIUM">Medium — Normal Operation</option>
                <option value="HIGH">High — Urgent Ward Need</option>
                <option value="EMERGENCY">EMERGENCY — Critical Stock Depletion</option>
              </select>
            </div>

            {/* Reason */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Transfer Reason / Clinical Context</label>
              <textarea
                className="form-input"
                rows="2"
                placeholder="e.g., Critical trauma patient in OR requiring 3 units of O- blood..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            {/* Notes */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Additional Dispatch Notes (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Courier dispatch requested for 14:00..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !targetHospitalId}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            >
              <Send size={16} />
              <span>{submitting ? 'Submitting Transfer Request...' : 'Send Inter-Hospital Request'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
