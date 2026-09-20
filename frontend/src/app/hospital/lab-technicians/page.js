'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  FlaskConical,
  Plus,
  UserCheck,
  Mail,
  Lock,
  Phone,
  BadgeCheck,
  Award,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  Users,
} from 'lucide-react';

export default function HospitalLabTechniciansPage() {
  const { user } = useAuth();
  const [labTechs, setLabTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [qualification, setQualification] = useState('Certified Hematology & Blood Bank Specialist');

  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchLabTechnicians();
  }, [user]);

  const fetchLabTechnicians = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/hospital/lab-technicians', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLabTechs(data.labTechnicians || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLabTech = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/hospital/lab-technicians', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          licenseNumber: licenseNumber.trim() || undefined,
          qualification,
        }),
      });


      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create Lab Technician account');
      }

      setSuccessMsg(`✅ Account created for ${data.user?.name || name}! They can now log in using ${email}.`);
      
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setLicenseNumber('');

      fetchLabTechnicians();
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg(null);
      }, 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const filteredTechs = labTechs.filter(t =>
    t.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="dashboard-content" style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Title Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <FlaskConical size={22} color="#ef4444" />
              </div>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Laboratory Technicians
              </h1>
            </div>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Create and manage licensed hematologists and lab screening personnel for {user?.hospital?.name || 'your hospital'}.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
            }}
          >
            <Plus size={18} />
            <span>Register New Lab Technician</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search lab technicians by name, email, or license number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '14px',
              color: '#0f172a',
            }}
          />
        </div>

        {/* Technicians List Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            Loading hospital lab technicians...
          </div>
        ) : filteredTechs.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            border: '1px border-dashed #cbd5e1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <FlaskConical size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
              No Lab Technicians Registered Yet
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '440px', margin: '0 auto 20px' }}>
              Click the button above to register your first Laboratory Technician. They will receive portal login access to process blood unit pathogen screenings and ABO typing.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
            >
              Register First Technician
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {filteredTechs.map((tech) => (
              <div
                key={tech.labTechId}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {tech.user?.name ? tech.user.name.charAt(0) : 'L'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>
                        {tech.user?.name}
                      </h4>
                      <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <BadgeCheck size={14} color="#059669" />
                        <span>License: {tech.licenseNumber}</span>
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '4px 8px',
                    borderRadius: '20px',
                    backgroundColor: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                  }}>
                    {tech.status}
                  </span>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={15} color="#94a3b8" />
                    <span>{tech.user?.email}</span>
                  </div>
                  {tech.user?.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={15} color="#94a3b8" />
                      <span>{tech.user?.phone}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={15} color="#94a3b8" />
                    <span style={{ fontWeight: '500' }}>{tech.qualification || 'Certified Lab Specialist'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Create Lab Technician */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FlaskConical size={22} color="#ef4444" />
                  <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Register Lab Technician</h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Form */}
              <div style={{ padding: '24px' }}>
                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleCreateLabTech}>
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label" style={{ fontWeight: '600' }}>Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Dr. Alex Rivera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label" style={{ fontWeight: '600' }}>Email Address (Login Username) *</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. lab.alex@hospital.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label" style={{ fontWeight: '600' }}>Password *</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Assign temporary password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: '600' }}>Phone Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="+237 670 000 000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: '600' }}>License Number</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Optional (Auto-generated)"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label" style={{ fontWeight: '600' }}>Qualification / Specialization</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Certified Hematologist"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '600' }}
                  >
                    {formLoading ? 'Creating Account...' : 'Create Lab Technician Account'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
