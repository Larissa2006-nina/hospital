'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Droplet, Heart, Activity, User, Mail, Lock, Phone, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [role, setRole] = useState('DONOR'); // DONOR or PATIENT
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1996-05-15');
  const [gender, setGender] = useState('Female');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Yaounde');

  // Donor Specific Fields
  const [bloodGroup, setBloodGroup] = useState('O_POS');
  const [weight, setWeight] = useState(65);
  const [latitude, setLatitude] = useState(4.051);
  const [longitude, setLongitude] = useState(9.7679);


  // Patient Specific Fields
  const [medicalId, setMedicalId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          alert(`Location captured: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => alert('Could not get live location. Using metropolitan defaults.')
      );
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name,
        email,
        password,
        phone,
        role,
        dateOfBirth,
        gender,
        address,
        city,
        ...(role === 'DONOR' ? { bloodGroup, weight, latitude, longitude } : { medicalId }),
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Automatically log in and redirect to dashboard
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header style={{ padding: '20px 32px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Droplet size={20} color="#ffffff" />
          </div>
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
            Blood<span style={{ color: '#dc2626' }}>Link</span>
          </span>
        </Link>
      </header>

      {/* Main Registration Box */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ maxWidth: '640px', width: '100%' }}>
          <div className="card" style={{ padding: '36px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
                Create Your Account
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
                Join the BloodLink network to save lives or request clinical blood units
              </p>

              {/* Role Selector Tabs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                background: '#f1f5f9',
                padding: '4px',
                borderRadius: '12px',
                marginTop: '20px',
              }}>
                <button
                  type="button"
                  onClick={() => setRole('DONOR')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: role === 'DONOR' ? '#ffffff' : 'transparent',
                    color: role === 'DONOR' ? '#dc2626' : '#64748b',
                    fontWeight: '700',
                    fontSize: '14px',
                    boxShadow: role === 'DONOR' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Heart size={18} />
                  <span>Register as Blood Donor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('PATIENT')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: role === 'PATIENT' ? '#ffffff' : 'transparent',
                    color: role === 'PATIENT' ? '#059669' : '#64748b',
                    fontWeight: '700',
                    fontSize: '14px',
                    boxShadow: role === 'PATIENT' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Activity size={18} />
                  <span>Register as Patient</span>
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                color: '#b91c1c',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Sarah Jenkins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="sarah@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Role Specific Fields */}
              {role === 'DONOR' ? (
                <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#991b1b', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Donor Eligibility Profile
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Blood Group</label>
                      <select className="form-select" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                        <option value="O_POS">O+ (O Positive)</option>
                        <option value="O_NEG">O- (O Negative Universal)</option>
                        <option value="A_POS">A+ (A Positive)</option>
                        <option value="A_NEG">A- (A Negative)</option>
                        <option value="B_POS">B+ (B Positive)</option>
                        <option value="B_NEG">B- (B Negative)</option>
                        <option value="AB_POS">AB+ (AB Positive)</option>
                        <option value="AB_NEG">AB- (AB Negative)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Weight (kg)</label>
                      <input
                        type="number"
                        min="45"
                        max="200"
                        className="form-input"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Location Coords: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </span>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px' }}
                    >
                      <MapPin size={14} color="#dc2626" />
                      <span>Capture GPS Location</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#065f46', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Patient Medical Information
                  </h4>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">National Medical Record ID / Insurance ID (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. MED-PAT-2026-9021"
                      value={medicalId}
                      onChange={(e) => setMedicalId(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Residential Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="123 Main Street"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '10px' }}
              >
                {loading ? 'Creating Account & Initializing...' : `Register as ${role === 'DONOR' ? 'Blood Donor' : 'Patient'}`}
              </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
              Already registered?{' '}
              <Link href="/login" style={{ color: '#dc2626', fontWeight: '600', textDecoration: 'none' }}>
                Sign In to Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
