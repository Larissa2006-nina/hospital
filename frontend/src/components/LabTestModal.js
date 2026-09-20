'use client';

import React, { useState } from 'react';
import { FlaskConical, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

export default function LabTestModal({ unit, onClose, onSuccess }) {
  const [hivTest, setHivTest] = useState('NEGATIVE');
  const [hbvTest, setHbvTest] = useState('NEGATIVE');
  const [hcvTest, setHcvTest] = useState('NEGATIVE');
  const [syphilisTest, setSyphilisTest] = useState('NEGATIVE');
  const [verifiedGroup, setVerifiedGroup] = useState(unit?.bloodGroup || 'O_POS');
  const [storageLocation, setStorageLocation] = useState(`Vault Storage Rack ${unit?.bloodGroup || 'O_POS'}-101`);
  const [testNotes, setTestNotes] = useState('All serological screenings negative. Verified ABO/Rh.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!unit) return null;

  const handleSubmit = async (decision) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/lab/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodUnitId: unit.bloodUnitId,
          hivTest,
          hbvTest,
          hcvTest,
          syphilisTest,
          verifiedGroup,
          storageLocation,
          testNotes,
          decision,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit test results');
      }

      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasPositiveTest =
    hivTest === 'POSITIVE' ||
    hbvTest === 'POSITIVE' ||
    hcvTest === 'POSITIVE' ||
    syphilisTest === 'POSITIVE';

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
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FlaskConical size={22} color="#a5b4fc" />
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700' }}>Laboratory Blood Screening & ABO Verification</h3>
              <div style={{ fontSize: '12px', color: '#c7d2fe' }}>Unit ID: #{unit.bloodUnitId.slice(-8)} &bull; {unit.componentType}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#c7d2fe', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {/* Unit Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Initial Group:</span>
              <strong style={{ color: '#dc2626' }}>{unit.bloodGroup.replace('_', '+')}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Quantity:</span>
              <strong>{unit.quantity} ml</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Collection Date:</span>
              <strong>{new Date(unit.collectionDate).toLocaleDateString()}</strong>
            </div>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#1e293b' }}>
            1. Infectious Disease Screening Panel
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">HIV 1/2 Antibody & p24</label>
              <select className="form-select" value={hivTest} onChange={(e) => setHivTest(e.target.value)}>
                <option value="NEGATIVE">NEGATIVE (Non-Reactive)</option>
                <option value="POSITIVE">POSITIVE (Reactive - Reject)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Hepatitis B Surface (HBsAg)</label>
              <select className="form-select" value={hbvTest} onChange={(e) => setHbvTest(e.target.value)}>
                <option value="NEGATIVE">NEGATIVE (Non-Reactive)</option>
                <option value="POSITIVE">POSITIVE (Reactive - Reject)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Hepatitis C Antibody (anti-HCV)</label>
              <select className="form-select" value={hcvTest} onChange={(e) => setHcvTest(e.target.value)}>
                <option value="NEGATIVE">NEGATIVE (Non-Reactive)</option>
                <option value="POSITIVE">POSITIVE (Reactive - Reject)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Syphilis (VDRL / RPR)</label>
              <select className="form-select" value={syphilisTest} onChange={(e) => setSyphilisTest(e.target.value)}>
                <option value="NEGATIVE">NEGATIVE (Non-Reactive)</option>
                <option value="POSITIVE">POSITIVE (Reactive - Reject)</option>
              </select>
            </div>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#1e293b' }}>
            2. Immunohematology & Blood Group Confirmation
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Verified ABO / Rh Typing</label>
              <select className="form-select" value={verifiedGroup} onChange={(e) => setVerifiedGroup(e.target.value)}>
                <option value="A_POS">A+ (A Positive)</option>
                <option value="A_NEG">A- (A Negative)</option>
                <option value="B_POS">B+ (B Positive)</option>
                <option value="B_NEG">B- (B Negative)</option>
                <option value="AB_POS">AB+ (AB Positive)</option>
                <option value="AB_NEG">AB- (AB Negative)</option>
                <option value="O_POS">O+ (O Positive)</option>
                <option value="O_NEG">O- (O Negative Universal)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Assigned Storage Vault Rack</label>
              <input
                type="text"
                className="form-input"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Lab Technician Observations & Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={testNotes}
              onChange={(e) => setTestNotes(e.target.value)}
            />
          </div>

          {hasPositiveTest && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} />
              <span>Reactive pathogen detected! This blood unit CANNOT be approved and must be safely DISCARDED.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit('REJECT')}
              className="btn btn-danger"
              style={{ padding: '12px' }}
            >
              <XCircle size={18} />
              <span>Reject & Discard Unit</span>
            </button>

            <button
              type="button"
              disabled={loading || hasPositiveTest}
              onClick={() => handleSubmit('APPROVE')}
              className="btn btn-success"
              style={{ padding: '12px' }}
            >
              <CheckCircle size={18} />
              <span>Approve for Blood Bank Stock</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
