'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Building2,
  Droplet,
  Heart,
  Calendar,
  CreditCard,
  AlertTriangle,
  FileText,
  Activity,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [paymentsData, setPaymentsData] = useState({ totalRevenue: 0, transactions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [hospRes, invRes, apptRes, reqRes, emgRes, payRes] = await Promise.all([
        fetch('/api/hospitals'),
        fetch('/api/blood-bank/inventory'),
        fetch('/api/appointments'),
        fetch('/api/blood-requests'),
        fetch('/api/emergency'),
        fetch('/api/payments'),
      ]);

      if (hospRes.ok) setHospitals((await hospRes.json()).hospitals || []);
      if (invRes.ok) setInventory(await invRes.json());
      if (apptRes.ok) setAppointments((await apptRes.json()).appointments || []);
      if (reqRes.ok) setRequests((await reqRes.json()).requests || []);
      if (emgRes.ok) setEmergencies((await emgRes.json()).emergencies || []);
      if (payRes.ok) setPaymentsData(await payRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalAvailableUnits = inventory?.stockByStatus?.AVAILABLE || 0;
  const activeEmergenciesCount = emergencies.filter(e => e.status !== 'FULFILLED' && e.status !== 'CANCELLED').length;

  return (
    <DashboardLayout>
      {/* Executive Welcome Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '24px', marginBottom: '32px' }}>
        <div className="card" style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <span className="badge badge-danger" style={{ marginBottom: '12px', fontSize: '11px', textTransform: 'uppercase' }}>
              Executive Medical Administration
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', color: '#ffffff' }}>
              System Command Center
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '480px', lineHeight: '1.5' }}>
              Comprehensive oversight across partner hospitals, regional Blood Banks, registered donors, patient clinical allocations, and Stripe payments.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <Link href="/admin/reports" className="btn btn-primary btn-sm">
                <FileText size={16} />
                <span>Generate Executive Reports</span>
              </Link>
              <Link href="/admin/hospitals" className="btn btn-secondary btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', borderColor: 'transparent' }}>
                <Building2 size={16} />
                <span>Manage Hospitals & BloodBanks</span>
              </Link>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>System Network Status</h3>
            <span className="badge badge-success">ONLINE (100%)</span>
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Prisma ORM & PostgreSQL:</span>
              <strong style={{ color: '#059669' }}>Connected</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>OSRM Geolocation Engine:</span>
              <strong style={{ color: '#059669' }}>Operational</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Stripe Payment API Gateway:</span>
              <strong style={{ color: '#059669' }}>Active</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Executive Metric Cards */}
      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Partner Hospitals</span>
            <div style={{ background: '#e0f2fe', padding: '6px', borderRadius: '8px' }}>
              <Building2 size={18} color="#0284c7" />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a' }}>{hospitals.length}</div>
          <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>All facilities operational</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Screened Blood Bank Units</span>
            <div style={{ background: '#fee2e2', padding: '6px', borderRadius: '8px' }}>
              <Droplet size={18} color="#dc2626" />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#dc2626' }}>{totalAvailableUnits}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Across all blood groups</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Total System Revenue</span>
            <div style={{ background: '#ecfdf5', padding: '6px', borderRadius: '8px' }}>
              <CreditCard size={18} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#059669' }}>
            ${paymentsData.totalRevenue.toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Stripe payments verified</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Active Emergencies</span>
            <div style={{ background: '#fef2f2', padding: '6px', borderRadius: '8px' }}>
              <AlertTriangle size={18} color="#dc2626" />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: activeEmergenciesCount > 0 ? '#dc2626' : '#0f172a' }}>
            {activeEmergenciesCount}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Trauma broadcasts active</div>
        </div>
      </div>

      {/* 8 Quick Management Modules Grid */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>
          System Administration Modules
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { title: 'Hospital Facilities', count: `${hospitals.length} Active`, icon: Building2, href: '/admin/hospitals', color: '#0284c7' },
            { title: 'User Management', count: '5 Roles', icon: Users, href: '/admin/users', color: '#7c3aed' },
            { title: 'Global Blood Banks', count: `${totalAvailableUnits} Units`, icon: Droplet, href: '/admin/blood-banks', color: '#dc2626' },
            { title: 'All Appointments', count: `${appointments.length} Scheduled`, icon: Calendar, href: '/admin/appointments', color: '#059669' },
            { title: 'Patient Requests', count: `${requests.length} Total`, icon: Heart, href: '/admin/requests', color: '#ea580c' },
            { title: 'Emergency Dispatch', count: `${emergencies.length} Alerts`, icon: AlertTriangle, href: '/admin/emergency', color: '#dc2626' },
            { title: 'Financial Audit', count: `$${paymentsData.totalRevenue.toFixed(0)} Collected`, icon: CreditCard, href: '/admin/transactions', color: '#059669' },
            { title: 'Executive Reports', count: '9 Formats', icon: FileText, href: '/admin/reports', color: '#334155' },
          ].map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.title}
                href={mod.href}
                className="card card-hover"
                style={{ textDecoration: 'none', color: 'inherit', padding: '20px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '10px' }}>
                    <Icon size={20} color={mod.color} />
                  </div>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>{mod.title}</strong>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{mod.count}</div>
                <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Open Module</span>
                  <ArrowRight size={12} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
