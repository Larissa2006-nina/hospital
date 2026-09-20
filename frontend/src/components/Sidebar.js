'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Activity,
  Heart,
  Droplet,
  Calendar,
  Building2,
  FileText,
  AlertTriangle,
  CreditCard,
  FlaskConical,
  Users,
  MapPin,
  LogOut,
  Sliders,
  Sparkles,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const role = user?.role || 'DONOR';

  // Navigation Items per Role
  const getNavItems = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { name: 'Admin Dashboard', href: '/admin', icon: Sliders },
          { name: 'Hospital Management', href: '/admin/hospitals', icon: Building2 },
          { name: 'User Management', href: '/admin/users', icon: Users },
          { name: 'Global Blood Banks', href: '/admin/blood-banks', icon: Droplet },
          { name: 'All Appointments', href: '/admin/appointments', icon: Calendar },
          { name: 'Blood Requests', href: '/admin/requests', icon: Heart },
          { name: 'Emergency Alerts', href: '/admin/emergency', icon: AlertTriangle },
          { name: 'Financial & Payments', href: '/admin/transactions', icon: CreditCard },
          { name: 'System Reports', href: '/admin/reports', icon: FileText },
        ];
      case 'HOSPITAL':
        return [
          { name: 'Hospital Dashboard', href: '/hospital', icon: Activity },
          { name: 'Blood Bank Inventory', href: '/hospital/blood-bank', icon: Droplet },
          { name: 'Lab Technicians', href: '/hospital/lab-technicians', icon: FlaskConical },
          { name: 'Donor Appointments', href: '/hospital/appointments', icon: Calendar },
          { name: 'Blood Donations Queue', href: '/hospital/donations', icon: Heart },
          { name: 'Patient Blood Requests', href: '/hospital/requests', icon: FileText },
          { name: 'Emergency Request Hub', href: '/hospital/emergency', icon: AlertTriangle },
          { name: 'Financial Transactions', href: '/hospital/transactions', icon: CreditCard },
          { name: 'Hospital Reports', href: '/hospital/reports', icon: FileText },
        ];

      case 'DONOR':
        return [
          { name: 'Donor Dashboard', href: '/donor', icon: Heart },
          { name: 'Find Hospitals & Route', href: '/donor/map', icon: MapPin },
          { name: 'Book Appointment', href: '/donor/book', icon: Calendar },
          { name: 'Donation History', href: '/donor/history', icon: Droplet },
          { name: 'Emergency Alerts', href: '/donor/emergency', icon: AlertTriangle },
          { name: 'Donor Profile', href: '/donor/profile', icon: Users },
        ];
      case 'PATIENT':
        return [
          { name: 'Patient Dashboard', href: '/patient', icon: Activity },
          { name: 'Request Blood', href: '/patient/new-request', icon: Heart },
          { name: 'My Blood Requests', href: '/patient/requests', icon: FileText },
          { name: 'Invoices & Payments', href: '/patient/payments', icon: CreditCard },
          { name: 'Patient Profile', href: '/patient/profile', icon: Users },
        ];
      case 'LAB_TECH':
        return [
          { name: 'Laboratory Dashboard', href: '/lab', icon: FlaskConical },
          { name: 'Testing Queue', href: '/lab/testing', icon: Droplet },
          { name: 'Approved Blood Units', href: '/lab/approved', icon: Heart },
          { name: 'Discarded Units', href: '/lab/discarded', icon: AlertTriangle },
          { name: 'Lab Compliance Reports', href: '/lab/reports', icon: FileText },
        ];
      default:
        return [
          { name: 'Dashboard', href: '/dashboard', icon: Activity },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div style={{ padding: '24px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
        }}>
          <Droplet size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Blood<span style={{ color: '#ef4444' }}>Link</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {role.replace('_', ' ')} PORTAL
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 12px', marginBottom: '4px' }}>
          Menu Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href) && item.href.length > 6);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: '8px',
                color: isActive ? '#ffffff' : '#94a3b8',
                backgroundColor: isActive ? 'rgba(220, 38, 38, 0.2)' : 'transparent',
                borderLeft: isActive ? '3px solid #ef4444' : '3px solid transparent',
                fontWeight: isActive ? '600' : '500',
                fontSize: '14px',
                textDecoration: 'none',
                marginBottom: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={18} color={isActive ? '#ef4444' : '#94a3b8'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div style={{ padding: '16px', borderTop: '1px solid #1e293b', backgroundColor: '#0b1120' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              color: '#ef4444',
              border: '1px solid #334155',
            }}>
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Guest User'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {user?.role || 'Visitor'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
