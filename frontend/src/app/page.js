'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Droplet,
  Heart,
  Activity,
  ShieldAlert,
  MapPin,
  Calendar,
  CreditCard,
  FlaskConical,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
            }}>
              <Droplet size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
                Blood<span style={{ color: '#dc2626' }}>Link</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                Hospital Blood Donation Management System
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user ? (
              <Link
                href={
                  user.role === 'ADMIN' ? '/admin'
                  : user.role === 'HOSPITAL' ? '/hospital'
                  : user.role === 'DONOR' ? '/donor'
                  : user.role === 'PATIENT' ? '/patient'
                  : '/lab'
                }
                className="btn btn-primary"
              >
                <span>Go to {user.role} Dashboard</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-secondary">
                  Sign In
                </Link>
                <Link href="/register" className="btn btn-primary">
                  Register as Donor / Patient
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        padding: '80px 32px 70px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '9999px', padding: '6px 14px', fontSize: '13px', color: '#fca5a5', fontWeight: '600', marginBottom: '20px' }}>
            <Heart size={16} />
            <span>Certified Regional Blood Bank & Healthcare Network</span>
          </div>
          <h1 style={{ fontSize: '46px', fontWeight: '800', lineHeight: '1.15', marginBottom: '20px', letterSpacing: '-0.03em' }}>
            Saving Lives Through <span style={{ color: '#ef4444' }}>Intelligent Blood Banking</span> & Emergency Dispatch
          </h1>
          <p style={{ fontSize: '18px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '36px', maxWidth: '680px', margin: '0 auto 36px' }}>
            Connecting Donors, Patients, Hospitals, and Laboratory Technicians with real-time blood inventory tracking, GPS routing, emergency broadcasts, and verified financial transactions.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn btn-primary btn-lg">
              <Heart size={20} />
              <span>Register to Donate Blood</span>
            </Link>
            <Link href="/login" className="btn btn-secondary btn-lg" style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}>
              <span>Sign In to Clinical Portal</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Modern Platform Features Section */}
      <section style={{ padding: '70px 32px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '9999px',
            padding: '6px 16px',
            fontSize: '13px',
            color: '#dc2626',
            fontWeight: '700',
            marginBottom: '16px',
          }}>
            <Sparkles size={16} />
            <span>Next-Gen Healthcare Technology</span>
          </div>
          <h2 style={{ fontSize: '34px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.03em' }}>
            Built for Speed, Safety & Precision
          </h2>
          <p style={{ fontSize: '16px', color: '#64748b', marginTop: '10px', maxWidth: '640px', margin: '10px auto 0', lineHeight: '1.6' }}>
            Seamlessly integrating emergency dispatch, laboratory screening, blood bank inventory, and secure financial transactions in one clinical platform.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          marginBottom: '56px',
        }}>
          {/* Card 1: Emergency Broadcast */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              border: '1px solid #fecaca',
            }}>
              <ShieldAlert size={24} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
              Emergency Broadcasts
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginBottom: '16px' }}>
              Instant alert system targeting eligible nearby donors based on ABO compatibility, 90-day deferral status, and GPS coordinates.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#dc2626' }}>
              <span>Live Donor Dispatch</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Card 2: Lab Screening */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              border: '1px solid #bbf7d0',
            }}>
              <FlaskConical size={24} color="#16a34a" />
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
              5-Point Lab Screening
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginBottom: '16px' }}>
              Rigorous laboratory testing for HIV, Hepatitis B/C, Syphilis, and dual-technician blood group verification before release.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#16a34a' }}>
              <span>Strict Quality Assurance</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Card 3: Cold Chain Storage */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              border: '1px solid #bae6fd',
            }}>
              <Droplet size={24} color="#0284c7" />
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
              Smart Inventory Vault
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginBottom: '16px' }}>
              Real-time component tracking across hospital cold rooms with automated expiration monitoring and chain-of-custody logs.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#0284c7' }}>
              <span>Live Stock Monitoring</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Card 4: Stripe Checkout */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              border: '1px solid #e9d5ff',
            }}>
              <CreditCard size={24} color="#9333ea" />
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
              Stripe Secure Settlement
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginBottom: '16px' }}>
              Automated invoice generation for cross-match processing fees with encrypted 256-bit SSL patient payment portal.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#9333ea' }}>
              <span>Instant Receipts & Invoicing</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* Portal Fast-Track Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '20px',
          padding: '36px 40px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
        }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Multi-Role Ecosystem
            </span>
            <h3 style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px', marginBottom: '6px', color: '#ffffff' }}>
              Ready to Access Your Portal?
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '540px' }}>
              Whether you are a donor, patient, hospital administrator, or laboratory technician, log in to access your dedicated clinical interface.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '15px' }}>
              <span>Sign In to Portal</span>
              <ArrowRight size={16} />
            </Link>
            <Link href="/register" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)', padding: '12px 24px', fontSize: '15px' }}>
              <span>Register Account</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#0f172a', color: '#94a3b8', padding: '32px', marginTop: 'auto', borderTop: '1px solid #1e293b' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Droplet size={20} color="#ef4444" />
            <strong style={{ color: '#ffffff', fontSize: '16px' }}>BloodLink System</strong>
            <span style={{ fontSize: '12px' }}>&bull; Emergency Blood Logistics & Clinical Care</span>
          </div>
          <div style={{ fontSize: '13px' }}>
            &copy; 2026 Blood Donation & Hospital Management System. All clinical rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
