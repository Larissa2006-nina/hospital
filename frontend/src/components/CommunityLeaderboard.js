'use client';

import React from 'react';
import { Trophy, ShieldCheck, Heart, UserX, Award } from 'lucide-react';

export default function CommunityLeaderboard({ leaderboard = [], currentUserId }) {
  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={22} color="#eab308" />
            <span>Community Honor Roll & Leaderboard</span>
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Celebrating regional top voluntary blood donors while strictly respecting anonymity choices.
          </p>
        </div>
        <span style={{ fontSize: '12px', background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} />
          <span>Anonymous Mode Protected</span>
        </span>
      </div>

      {leaderboard.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '13px', background: '#f8fafc', borderRadius: '12px' }}>
          No donations recorded yet on the leaderboard. Be the first hero donor!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {leaderboard.map((entry, index) => {
            const isCurrentUser = currentUserId && (entry.userId === currentUserId || entry.donorId === currentUserId);
            const rank = index + 1;
            const isTop3 = rank <= 3;

            return (
              <div
                key={entry.donorId || index}
                style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: isCurrentUser ? '#fef2f2' : isTop3 ? '#fffbe6' : '#f8fafc',
                  border: isCurrentUser ? '1.5px solid #fecaca' : isTop3 ? '1.5px solid #fef08a' : '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  gap: '16px',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Rank & Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: rank === 1 ? '#eab308' : rank === 2 ? '#94a3b8' : rank === 3 ? '#d97706' : '#cbd5e1',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '14px',
                  }}>
                    {rank}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                        {entry.displayName}
                      </strong>
                      {entry.isAnonymous ? (
                        <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '10px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <UserX size={10} /> Anonymous
                        </span>
                      ) : null}
                      {isCurrentUser && (
                        <span style={{ fontSize: '10px', background: '#dc2626', color: '#ffffff', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                          You
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Blood Group: <strong style={{ color: '#dc2626' }}>{entry.bloodGroup?.replace('_', '+') || 'O+'}</strong>
                    </div>
                  </div>
                </div>

                {/* Badges Display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {entry.badges && entry.badges.length > 0 ? (
                    entry.badges.map((b, i) => (
                      <span
                        key={i}
                        title={b.name}
                        style={{
                          fontSize: '18px',
                          background: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {b.iconUrl || '🏆'}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                      {entry.isAnonymous ? 'Badges Hidden' : 'No public badges'}
                    </span>
                  )}
                </div>

                {/* Donation Count */}
                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    <Heart size={16} color="#dc2626" fill="#dc2626" />
                    <span>{entry.donationCount}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Donations Completed
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
