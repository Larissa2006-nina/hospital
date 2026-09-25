'use client';

import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Bell, Check, Lock, UserCheck } from 'lucide-react';
import { updatePrivacySettings } from '@/app/actions/badges';

export default function PrivacySettingsCard({ user, onUpdate }) {
  const [isAnonymous, setIsAnonymous] = useState(user?.isAnonymous ?? false);
  const [showBadgesPublicly, setShowBadgesPublicly] = useState(user?.showBadgesPublicly ?? true);
  const [receiveEmergencyOnly, setReceiveEmergencyOnly] = useState(user?.receiveEmergencyOnly ?? false);

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const handleToggle = async (key, currentValue, setter) => {
    const newValue = !currentValue;
    setter(newValue);

    const updatedState = {
      isAnonymous: key === 'isAnonymous' ? newValue : isAnonymous,
      showBadgesPublicly: key === 'showBadgesPublicly' ? newValue : showBadgesPublicly,
      receiveEmergencyOnly: key === 'receiveEmergencyOnly' ? newValue : receiveEmergencyOnly,
    };

    setSaving(true);
    try {
      // Call Server Action or API
      let res;
      if (user?.id) {
        res = await updatePrivacySettings({
          userId: user.id,
          ...updatedState,
        });
      } else {
        const fetchRes = await fetch('/api/donor/privacy', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedState),
        });
        res = await fetchRes.json();
      }

      if (res.success) {
        setToastMessage('Privacy preferences saved!');
        if (onUpdate) onUpdate(updatedState);
      } else {
        setToastMessage('Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving privacy settings:', err);
      setToastMessage('Error saving settings');
    } finally {
      setSaving(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const isMaskedOnLeaderboard = isAnonymous || !showBadgesPublicly;

  return (
    <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={22} color="#0284c7" />
            <span>Privacy & Anonymity Settings</span>
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Manage data control, public profile visibility, and anonymous mode preferences.
          </p>
        </div>

        {toastMessage && (
          <span style={{
            fontSize: '12px',
            background: '#ecfdf5',
            color: '#065f46',
            padding: '4px 12px',
            borderRadius: '20px',
            fontWeight: '600',
            border: '1px solid #a7f3d0',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <Check size={14} />
            {toastMessage}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Toggle List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Toggle 1: Enable Anonymous Mode */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ padding: '8px', background: '#e0f2fe', borderRadius: '10px', height: 'fit-content' }}>
                <EyeOff size={18} color="#0284c7" />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Enable Anonymous Mode</strong>
                <span style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4', display: 'block' }}>
                  Mask your real name as &quot;Anonymous Donor&quot; across public leaderboards while retaining private dashboard access.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer" style={{ cursor: 'pointer', marginLeft: '12px' }}>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={() => handleToggle('isAnonymous', isAnonymous, setIsAnonymous)}
                disabled={saving}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#dc2626' }}
              />
            </label>
          </div>

          {/* Toggle 2: Show Badges Publicly */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ padding: '8px', background: '#fef3c7', borderRadius: '10px', height: 'fit-content' }}>
                <Eye size={18} color="#d97706" />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Show Badges Publicly</strong>
                <span style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4', display: 'block' }}>
                  Display your earned milestone badges on community leaderboards and public donor honor rolls.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer" style={{ cursor: 'pointer', marginLeft: '12px' }}>
              <input
                type="checkbox"
                checked={showBadgesPublicly}
                onChange={() => handleToggle('showBadgesPublicly', showBadgesPublicly, setShowBadgesPublicly)}
                disabled={saving}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#dc2626' }}
              />
            </label>
          </div>

          {/* Toggle 3: Receive Emergency Alerts Only */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ padding: '8px', background: '#fee2e2', borderRadius: '10px', height: 'fit-content' }}>
                <Bell size={18} color="#dc2626" />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Emergency Alerts Only</strong>
                <span style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4', display: 'block' }}>
                  Filter out routine campaign updates and only receive urgent hospital emergency notifications.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer" style={{ cursor: 'pointer', marginLeft: '12px' }}>
              <input
                type="checkbox"
                checked={receiveEmergencyOnly}
                onChange={() => handleToggle('receiveEmergencyOnly', receiveEmergencyOnly, setReceiveEmergencyOnly)}
                disabled={saving}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#dc2626' }}
              />
            </label>
          </div>
        </div>

        {/* Live Identity Masking Preview */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <UserCheck size={18} color="#38bdf8" />
              <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                Live Privacy & Identity Preview
              </span>
            </div>

            {/* Public View Card */}
            <div style={{ background: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '14px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                Public Leaderboard Identity:
              </span>
              <div style={{ fontSize: '16px', fontWeight: '800', color: isMaskedOnLeaderboard ? '#fca5a5' : '#38bdf8' }}>
                {isMaskedOnLeaderboard ? '🕵️ Anonymous Donor' : `👤 ${user?.name || 'Hero Donor'}`}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                {isMaskedOnLeaderboard
                  ? 'Identity is protected. Your name is hidden from public view.'
                  : 'Public profile visible to community members.'}
              </div>
            </div>

            {/* Private View Card */}
            <div style={{ background: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                Private Personal Dashboard:
              </span>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#4ade80' }}>
                👤 {user?.name || 'Hero Donor'} (All Badges Visible)
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                Full access retained on your private dashboard regardless of public anonymity settings.
              </div>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={12} color="#38bdf8" />
            <span>Encrypted HIPAA & GDPR privacy rule enforcement.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
