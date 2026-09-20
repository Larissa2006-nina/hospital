'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Users, Mail, Phone, ShieldCheck, Heart, Activity, FlaskConical, Building2 } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?role=${filterRole}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={24} color="#dc2626" />
            <span>User Accounts & Role Permissions</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Live database records of registered Administrators, Donors, Patients, and Laboratory Technicians.
          </p>
        </div>

        <div>
          <select
            className="form-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="ALL">All Roles ({users.length})</option>
            <option value="ADMIN">Administrator</option>
            <option value="HOSPITAL">Hospital</option>
            <option value="DONOR">Donor</option>
            <option value="PATIENT">Patient</option>
            <option value="LAB_TECH">Lab Technician</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading users from database...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            No users found matching this role filter.
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Full Name</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th>Assigned Role</th>
                  <th>Profile Details</th>
                  <th>Registration Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name}</strong>
                    </td>
                    <td>
                      <span style={{ color: '#475569' }}>{u.email}</span>
                    </td>
                    <td>{u.phone || 'N/A'}</td>
                    <td>
                      <span className={`badge ${
                        u.role === 'ADMIN' ? 'badge-danger' :
                        u.role === 'HOSPITAL' ? 'badge-info' :
                        u.role === 'DONOR' ? 'badge-warning' :
                        u.role === 'PATIENT' ? 'badge-success' : 'badge-purple'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.donor ? (
                        <span className="badge badge-danger">Blood Group: {u.donor.bloodGroup?.replace('_', '+')}</span>
                      ) : u.patient ? (
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Medical ID: {u.patient.medicalId || 'Standard'}</span>
                      ) : u.labTechnician ? (
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Lic: {u.labTechnician.licenseNumber}</span>
                      ) : u.hospital ? (
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{u.hospital.name}</span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#64748b' }}>System Admin</span>
                      )}
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className="badge badge-success">ACTIVE</span>
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
