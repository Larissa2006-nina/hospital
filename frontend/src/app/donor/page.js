'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import BadgesAndImpact from '@/components/BadgesAndImpact';
import PrivacySettingsCard from '@/components/PrivacySettingsCard';
import CommunityLeaderboard from '@/components/CommunityLeaderboard';
import { useAuth } from '@/context/AuthContext';
import { Heart, Calendar, Droplet, MapPin, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function DonorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [donations, setDonations] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [nearestHospital, setNearestHospital] = useState(null);
  const [badgeData, setBadgeData] = useState({
    earnedBadges: [],
    lockedBadges: [],
    leaderboard: [],
    currentUser: null,
    totalCompletedDonations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonorData();
  }, [user]);

  const fetchDonorData = async () => {
    try {
      const [apptRes, donRes, emergRes, hospRes, badgeRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/donations'),
        fetch('/api/emergency?active=true'),
        fetch('/api/hospitals'),
        fetch('/api/donor/badges'),
      ]);

      if (apptRes.ok) {
        const apptData = await apptRes.json();
        setAppointments(apptData.appointments || []);
      }
      if (donRes.ok) {
        const donData = await donRes.json();
        setDonations(donData.donations || []);
      }
      if (emergRes.ok) {
        const emergData = await emergRes.json();
        setEmergencies(emergData.emergencies || []);
      }
      if (hospRes.ok) {
        const hospData = await hospRes.json();
        if (hospData.hospitals?.length > 0) {
          setNearestHospital(hospData.hospitals[0]);
        }
      }
      if (badgeRes.ok) {
        const bData = await badgeRes.json();
        setBadgeData({
          earnedBadges: bData.currentDonorData?.earnedBadges || [],
          lockedBadges: bData.currentDonorData?.lockedBadges || [],
          leaderboard: bData.leaderboard || [],
          currentUser: bData.currentDonorData?.user || user,
          totalCompletedDonations: bData.currentDonorData?.totalCompletedDonations || 0,
        });
      }
    } catch (e) {
      console.error('Error fetching donor dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const donor = user?.donor;
  const bloodGroupDisplay = donor?.bloodGroup?.replace('_', '+') || 'O+';

  let daysRemaining = 0;
  if (donor?.lastDonationDate) {
    const lastDate = new Date(donor.lastDonationDate);
    const eligibleDate = new Date(lastDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    const diffTime = eligibleDate - new Date();
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  const upcomingAppt = appointments.find(a => a.status === 'CONFIRMED' || a.status === 'PENDING');

  return (
    <DashboardLayout>
      {/* Welcome Banner & Blood Group Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '24px', marginBottom: '32px' }}>
        <div className="card" style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '32px',
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', color: '#fca5a5', fontWeight: '600', marginBottom: '12px' }}>
              <Heart size={14} color="#ef4444" />
              <span>Certified Hero Donor</span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', color: '#ffffff' }}>
              Welcome back, {user?.name || 'Hero Donor'}!
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '480px', lineHeight: '1.5' }}>
              Your blood donations directly replenish regional hospital blood banks and provide life-saving transfusions for emergency trauma patients.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <Link href="/donor/book" className="btn btn-primary btn-sm">
                <Calendar size={16} />
                <span>Book New Appointment</span>
              </Link>
              <Link href="/donor/map" className="btn btn-secondary btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}>
                <MapPin size={16} />
                <span>Locate Nearby Hospitals</span>
              </Link>
            </div>
          </div>

          {/* Large Blood Group Badge */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: '900',
              boxShadow: '0 10px 25px rgba(220, 38, 38, 0.4)',
              border: '3px solid rgba(255,255,255,0.2)',
              margin: '0 auto 8px',
            }}>
              {bloodGroupDisplay}
            </div>
            <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>Blood Group</span>
          </div>
        </div>

        {/* Eligibility Status Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Donation Eligibility</h3>
            <span className={`badge ${daysRemaining === 0 ? 'badge-success' : 'badge-warning'}`}>
              {daysRemaining === 0 ? 'ELIGIBLE TO DONATE' : `${daysRemaining} DAYS DEFERRED`}
            </span>
          </div>

          {daysRemaining === 0 ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', marginBottom: '8px' }}>
                <CheckCircle2 size={24} />
                <strong style={{ fontSize: '16px' }}>You are eligible to donate today!</strong>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
                Your body has fully replenished healthy blood cells. Schedule an appointment at any hospital.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', marginBottom: '8px' }}>
                <Clock size={24} />
                <strong style={{ fontSize: '16px' }}>Recovery Period Active</strong>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
                A 90-day waiting period ensures donor health and hemoglobin restoration. Next donation date in {daysRemaining} days.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Alert Banner (if active alerts) */}
      {emergencies.length > 0 && (
        <div className="emergency-pulse" style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <ShieldAlert size={32} color="#ffffff" />
            <div>
              <div style={{ fontSize: '16px', fontWeight: '800' }}>
                🚨 Urgent Emergency Blood Request: {emergencies[0].bloodGroup?.replace('_', '+')} Needed
              </div>
              <div style={{ fontSize: '13px', color: '#fee2e2' }}>
                {emergencies[0].hospital?.name} requires {emergencies[0].quantityNeeded} units. Clinical Reason: {emergencies[0].reason}
              </div>
            </div>
          </div>
          <Link href="/donor/emergency" className="btn btn-secondary" style={{ background: '#ffffff', color: '#991b1b', fontWeight: '700' }}>
            Respond to Emergency Alert &rarr;
          </Link>
        </div>
      )}

      {/* 3 Metric Cards */}
      <div className="grid-3" style={{ marginBottom: '32px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Total Lifetime Donations</span>
            <div style={{ background: '#fee2e2', padding: '8px', borderRadius: '10px' }}>
              <Droplet size={20} color="#dc2626" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>
            {donations.length}
          </div>
          <div style={{ fontSize: '12px', color: '#059669', fontWeight: '600', marginTop: '4px' }}>
            ~{donations.length * 3} lives directly impacted
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Upcoming Appointment</span>
            <div style={{ background: '#e0f2fe', padding: '8px', borderRadius: '10px' }}>
              <Calendar size={20} color="#0284c7" />
            </div>
          </div>
          {upcomingAppt ? (
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                {new Date(upcomingAppt.appointmentDate).toLocaleDateString()}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {upcomingAppt.appointmentTime} &bull; {upcomingAppt.hospital?.name}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#64748b' }}>None scheduled</div>
              <Link href="/donor/book" style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600', textDecoration: 'none' }}>
                + Book now
              </Link>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Nearest Hospital Center</span>
            <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '10px' }}>
              <MapPin size={20} color="#059669" />
            </div>
          </div>
          {nearestHospital ? (
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {nearestHospital.name}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {nearestHospital.address}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: '#64748b' }}>Searching nearby...</div>
          )}
        </div>
      </div>

      {/* Gamification System Section: Badges & Impact */}
      <BadgesAndImpact
        earnedBadges={badgeData.earnedBadges}
        lockedBadges={badgeData.lockedBadges}
        totalCompletedDonations={badgeData.totalCompletedDonations || donations.length}
      />

      {/* Privacy Controls Section */}
      <PrivacySettingsCard
        user={badgeData.currentUser || user}
        onUpdate={() => fetchDonorData()}
      />

      {/* Community Honor Roll & Leaderboard */}
      <CommunityLeaderboard
        leaderboard={badgeData.leaderboard}
        currentUserId={user?.id}
      />

      {/* Recent Appointments & Donation History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '32px' }}>
        {/* Appointments Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Your Appointments</h3>
            <Link href="/donor/book" className="btn btn-secondary btn-sm">
              Schedule New
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>
              No appointments scheduled yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {appointments.slice(0, 4).map((appt) => (
                <div key={appt.appointmentId} style={{ padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{appt.hospital?.name}</strong>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(appt.appointmentDate).toLocaleDateString()} at {appt.appointmentTime} ({appt.appointmentType})
                    </div>
                  </div>
                  <span className={`badge ${appt.status === 'COMPLETED' ? 'badge-success' : appt.status === 'CONFIRMED' ? 'badge-info' : 'badge-neutral'}`}>
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Donation History Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Donation History</h3>
            <Link href="/donor/history" style={{ fontSize: '13px', color: '#dc2626', fontWeight: '600', textDecoration: 'none' }}>
              View All &rarr;
            </Link>
          </div>

          {donations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>
              No donation records yet. Schedule your first donation!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {donations.slice(0, 4).map((don) => (
                <div key={don.donationId} style={{ padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{don.quantity}ml {don.bloodGroup?.replace('_', '+')}</strong>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(don.donationDate).toLocaleDateString()} at {don.hospital?.name}
                    </div>
                  </div>
                  <span className="badge badge-success">
                    PASSED & APPROVED
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
