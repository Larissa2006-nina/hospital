'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Building2, MapPin, Phone, Mail, Droplet, Plus, Save } from 'lucide-react';

const emptyForm = {
  hospitalName: '',
  email: '',
  password: '',
  phone: '',
  licenseNumber: '',
  address: '',
  city: '',
  contactNumber: '',
  latitude: '',
  longitude: '',
  bloodBankName: '',
};

export default function AdminHospitalsPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hospitals');
      const data = await res.json();
      if (data.success) {
        setHospitals(data.hospitals || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/hospitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...form,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
        }),
      });


      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create hospital.');
      }

      setMessage({ type: 'success', text: data.message || 'Hospital account created successfully.' });
      setForm(emptyForm);
      await fetchHospitals();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to create hospital account.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={24} color="#dc2626" />
            <span>Hospital Network & Blood Bank Facilities</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Registered partner hospitals, geographic coordinates, license numbers, and associated BloodBank repositories.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Plus size={18} color="#dc2626" />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Register new hospital account</h3>
        </div>

        {message.text && (
          <div style={{
            padding: '12px 14px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '13px',
            backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: message.type === 'success' ? '#065f46' : '#b91c1c',
            border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Hospital Name</label>
              <input className="form-input" name="hospitalName" value={form.hospitalName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Login Email</label>
              <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Temporary Password</label>
              <input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Hospital Phone</label>
              <input className="form-input" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">License Number</label>
              <input className="form-input" name="licenseNumber" value={form.licenseNumber} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Bank Name</label>
              <input className="form-input" name="bloodBankName" value={form.bloodBankName} onChange={handleChange} placeholder="Optional" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Street Address</label>
              <input className="form-input" name="address" value={form.address} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" name="city" value={form.city} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input className="form-input" name="contactNumber" value={form.contactNumber} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input className="form-input" type="number" step="any" name="latitude" value={form.latitude} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input className="form-input" type="number" step="any" name="longitude" value={form.longitude} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={16} />
              {submitting ? 'Creating hospital...' : 'Create hospital account'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading hospital network...</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hospital Name</th>
                  <th>License Number</th>
                  <th>Address & City</th>
                  <th>Coordinates</th>
                  <th>Blood Bank Facility</th>
                  <th>Available Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {hospitals.map((h) => (
                  <tr key={h.hospitalId}>
                    <td>
                      <strong>{h.name}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{h.email}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '600' }}>
                        {h.licenseNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>{h.address}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{h.city} &bull; {h.contactNumber}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#475569' }}>
                        {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>
                        {h.bloodBank?.name || 'Central Repository'}
                      </span>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{h.bloodBank?.location}</div>
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontSize: '12px' }}>
                        {h.bloodBank?.availableUnitsCount || 0} Units
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success">
                        {h.status}
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
