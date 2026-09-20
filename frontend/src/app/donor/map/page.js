'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import HospitalMap from '@/components/HospitalMap';
import { MapPin, Navigation } from 'lucide-react';

export default function DonorMapPage() {
  return (
    <DashboardLayout>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <MapPin size={22} color="#dc2626" />
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
            Nearby Hospitals & Live Driving Route Navigation
          </h1>
        </div>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Explore all hospital Blood Bank facilities in the metropolitan area. The system calculates driving distance, travel duration, and route directions via the OSRM routing engine.
        </p>
      </div>

      <HospitalMap />
    </DashboardLayout>
  );
}
