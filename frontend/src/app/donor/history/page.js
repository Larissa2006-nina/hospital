'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Droplet, Calendar, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function DonationHistoryPage() {
  const { user } = useAuth();
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Droplet size={24} color="#dc2626" />
            <span>My Blood Donation History</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Verified records of your past blood donations and clinical laboratory clearances.
          </p>
        </div>
        <Link href="/donor/book" className="btn btn-primary">
          <Calendar size={16} />
          <span>Schedule Next Donation</span>
        </Link>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading records...</div>
        ) : donations.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Droplet size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
              No Donation Records Yet
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
              Book an appointment at a nearby hospital to start your donor journey!
            </p>
            <Link href="/donor/book" className="btn btn-primary">
              Book Appointment
            </Link>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Donation ID</th>
                  <th>Hospital Center</th>
                  <th>Date</th>
                  <th>Blood Group</th>
                  <th>Quantity</th>
                  <th>Screening Status</th>
                  <th>Units Generated</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((don) => (
                  <tr key={don.donationId}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#64748b' }}>
                        #{don.donationId.slice(-8)}
                      </span>
                    </td>
                    <td>
                      <strong>{don.hospital?.name}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{don.hospital?.city}</div>
                    </td>
                    <td>{new Date(don.donationDate).toLocaleDateString()}</td>
                    <td>
                      <span className="badge badge-danger">
                        {don.bloodGroup?.replace('_', '+')}
                      </span>
                    </td>
                    <td>{don.quantity} ml ({don.donationType})</td>
                    <td>
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={14} />
                        <span>PASSED & SCREENED</span>
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: '#059669', fontWeight: '600' }}>
                        {don.bloodUnits?.length || 1} Unit(s) in Blood Bank
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
