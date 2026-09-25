'use client';

import React from 'react';
import { Award, Lock, CheckCircle, Flame, Heart, Sparkles, Shield, Trophy } from 'lucide-react';

export default function BadgesAndImpact({
  earnedBadges = [],
  lockedBadges = [],
  totalCompletedDonations = 0,
}) {
  const livesSaved = totalCompletedDonations * 3;

  return (
    <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={22} color="#dc2626" />
            <span>Badges & Gamification Impact</span>
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Reward your voluntary donation milestones & unlock prestigious digital honors.
          </p>
        </div>

        {/* Quick Impact Pill */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '6px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={16} color="#dc2626" fill="#dc2626" />
            <div>
              <span style={{ fontSize: '11px', color: '#991b1b', display: 'block', fontWeight: '600' }}>Impact</span>
              <strong style={{ fontSize: '13px', color: '#7f1d1d' }}>~{livesSaved} Lives Saved</strong>
            </div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={16} color="#16a34a" />
            <div>
              <span style={{ fontSize: '11px', color: '#166534', display: 'block', fontWeight: '600' }}>Earned</span>
              <strong style={{ fontSize: '13px', color: '#14532d' }}>{earnedBadges.length} Badges</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Earned Badges Grid */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} color="#eab308" />
          <span>Unlocked Badges ({earnedBadges.length})</span>
        </h3>

        {earnedBadges.length === 0 ? (
          <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            <Flame size={28} color="#94a3b8" style={{ margin: '0 auto 8px', opacity: 0.6 }} />
            <p style={{ fontWeight: '600', color: '#334155' }}>No badges unlocked yet</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              Complete your first voluntary blood donation to earn the &quot;First Drop&quot; milestone badge!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
                  border: '1.5px solid #fecaca',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.05)',
                  position: 'relative',
                }}
              >
                <div style={{
                  fontSize: '32px',
                  lineHeight: '1',
                  background: '#ffffff',
                  padding: '8px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid #fee2e2',
                }}>
                  {badge.iconUrl || '🏆'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{badge.name}</strong>
                    <CheckCircle size={14} color="#16a34a" />
                  </div>
                  <p style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4', marginBottom: '6px' }}>
                    {badge.description}
                  </p>
                  <span style={{ fontSize: '10px', color: '#dc2626', background: 'rgba(220, 38, 38, 0.08)', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
                    Unlocked {badge.awardedAt ? new Date(badge.awardedAt).toLocaleDateString() : 'Active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Locked Badges Grid */}
      {lockedBadges.length > 0 && (
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={16} color="#64748b" />
            <span>Milestones to Unlock ({lockedBadges.length})</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
            {lockedBadges.map((badge) => {
              const progressPct = Math.min(100, Math.round((badge.progress / badge.needed) * 100));

              return (
                <div
                  key={badge.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    opacity: 0.85,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      fontSize: '28px',
                      filter: 'grayscale(100%) opacity(0.6)',
                      background: '#e2e8f0',
                      padding: '8px',
                      borderRadius: '12px',
                    }}>
                      {badge.iconUrl || '🔒'}
                    </div>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#475569' }}>{badge.name}</strong>
                      <p style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.3', marginTop: '2px' }}>
                        {badge.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>
                      <span>Progress</span>
                      <span>{badge.progress} / {badge.needed} donations</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${progressPct}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)',
                          borderRadius: '3px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
