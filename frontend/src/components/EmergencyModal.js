'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, Radio, X, BellRing } from 'lucide-react';

export default function EmergencyModal({ hospitalId, onClose, onSuccess }) {
  const [bloodGroup, setBloodGroup] = useState('O_NEG');
  const [quantityNeeded, setQuantityNeeded] = useState(3);
  const [urgencyLevel, setUrgencyLevel] = useState('EMERGENCY');
  const [reason, setReason] = useState('Critical trauma patient in Intensive Emergency Care');
  const [requiredHours, setRequiredHours] = useState(4);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const requiredDate = new Date(Date.now() + parseInt(requiredHours, 10) * 60 * 60 * 1000);

      const res = await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId,
          bloodGroup,
          quantityNeeded,
          urgencyLevel,
          reason,
          requiredDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch emergency request');
      }

      setResult(data);
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
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
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        border: '2px solid #ef4444',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={26} color="#ffffff" />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Emergency Blood Request Hub</h3>
              <div style={{ fontSize: '12px', color: '#fecaca' }}>Automated Blood Bank Audit & Donor Broadcast Engine</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {result ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              {result.stockSufficient ? (
                <div>
                  <CheckCircle size={54} color="#10b981" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '19px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                    Stock Available in Blood Bank!
                  </h3>
                  <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                    {result.availableStock} units of {bloodGroup.replace('_', '+')} are currently AVAILABLE in your Blood Bank. You can immediately allocate these units to the clinical ward.
                  </p>
                </div>
              ) : (
                <div>
                  <BellRing size={54} color="#dc2626" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '19px', fontWeight: '700', color: '#991b1b', marginBottom: '8px' }}>
                    Emergency Broadcast Dispatched!
                  </h3>
                  <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px' }}>
                    Blood bank stock is LOW ({result.availableStock} units available). The system automatically filtered and dispatched high-priority emergency alerts to <strong>{result.notifiedDonorsCount} eligible registered donors</strong>.
                  </p>
                </div>
              )}
              <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
                Done & View Emergency Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Blood Group Needed</label>
                  <select className="form-select" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                    <option value="O_NEG">O- (O Negative Universal)</option>
                    <option value="O_POS">O+ (O Positive)</option>
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
                    max="20"
                    className="form-input"
                    value={quantityNeeded}
                    onChange={(e) => setQuantityNeeded(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Urgency Level</label>
                  <select className="form-select" value={urgencyLevel} onChange={(e) => setUrgencyLevel(e.target.value)}>
                    <option value="EMERGENCY">CRITICAL EMERGENCY (Immediate)</option>
                    <option value="HIGH">HIGH (Within 4-8 Hours)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Required Within (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    className="form-input"
                    value={requiredHours}
                    onChange={(e) => setRequiredHours(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Indication / Reason</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. ICU Trauma resuscitation, acute surgical hemorrhage..."
                  required
                />
              </div>

              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#991b1b', marginBottom: '20px' }}>
                <strong>Automated Workflow:</strong> The system will first check the hospital Blood Bank. If inventory is insufficient, it will immediately identify and broadcast urgent push alerts to matching eligible donors within reach.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px', background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}
              >
                {loading ? 'Checking Stock & Dispatching Alerts...' : 'Initiate Emergency Stock Check & Broadcast'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
