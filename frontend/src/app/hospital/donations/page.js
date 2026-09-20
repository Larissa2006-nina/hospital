'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Droplet, Heart, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function HospitalDonationsPage() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/donations')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDonations(data.donations || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Heart size={24} color="#dc2626" />
          <span>Hospital Blood Collections & Phlebotomy Log</span>
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Chronological record of all blood donations collected and units generated for laboratory processing.
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading donation records...</div>
        ) : donations.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            No blood donations recorded yet.
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Donation ID</th>
                  <th>Donor Name</th>
                  <th>Blood Group</th>
                  <th>Volume (ml)</th>
                  <th>Collection Date</th>
                  <th>Screening Status</th>
                  <th>Units Produced</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.donationId}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>
                        #{d.donationId.slice(-8)}
                      </span>
                    </td>
                    <td>
                      <strong>{d.donor?.user?.name}</strong>
                    </td>
                    <td>
                      <span className="badge badge-danger">
                        {d.bloodGroup.replace('_', '+')}
                      </span>
                    </td>
                    <td>{d.quantity} ml ({d.donationType})</td>
                    <td>{new Date(d.donationDate).toLocaleDateString()}</td>
                    <td>
                      <span className="badge badge-success">
                        PASSED SCREENING
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#059669', fontWeight: '600' }}>
                        {d.bloodUnits?.length || 1} Unit(s) in Vault
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
