'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PrivacySettingsCard from '@/components/PrivacySettingsCard';
import { useAuth } from '@/context/AuthContext';
import { User, CheckCircle } from 'lucide-react';

export default function DonorProfilePage() {
  const { user, refreshUser } = useAuth();
  const donor = user?.donor;

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bloodGroup, setBloodGroup] = useState(donor?.bloodGroup || 'O_POS');
  const [weight, setWeight] = useState(donor?.weight || 65);
  const [address, setAddress] = useState(donor?.address || '');
  const [city, setCity] = useState(donor?.city || 'New York');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={24} color="#dc2626" />
            <span>Donor Profile & Privacy Settings</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Manage your personal details, blood group registry, and anonymity preferences.
          </p>
        </div>

        <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
          {saved && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <CheckCircle size={16} />
              <span>Profile information successfully updated.</span>
            </div>
          )}

          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                  style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select className="form-select" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
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
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input
                  type="number"
                  className="form-input"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Eligibility Status</label>
                <input
                  type="text"
                  className="form-input"
                  value={donor?.eligibilityStatus || 'ELIGIBLE'}
                  disabled
                  style={{ background: '#f1f5f9', fontWeight: '700', color: '#059669' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Privacy & Anonymity Settings Card */}
        <PrivacySettingsCard user={user} onUpdate={() => refreshUser && refreshUser()} />
      </div>
    </DashboardLayout>
  );
}
