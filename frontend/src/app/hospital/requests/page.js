'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FileText, Heart, Building2, CheckCircle2, XCircle, AlertTriangle, CreditCard, Plus } from 'lucide-react';
import RequestFromHospitalModal from '@/components/RequestFromHospitalModal';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function HospitalBloodRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PATIENT, TRANSFER

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await apiFetch('/blood-requests');
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, action) => {
    try {
      const res = await apiFetch('/blood-requests', {
        method: 'PATCH',
        body: JSON.stringify({ requestId, action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }

      alert(data.message || `Request ${action} completed successfully.`);
      fetchRequests();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (activeTab === 'PATIENT') return r.requestType === 'PATIENT_REQUEST' || !r.requestType;
    if (activeTab === 'TRANSFER') return r.requestType === 'HOSPITAL_TRANSFER';
    return true;
  });

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={24} color="#dc2626" />
            <span>Blood Requests & Inter-Hospital Transfers</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Manage inpatient blood requests, initiate inter-hospital inventory requests, and fulfill stock transfers.
          </p>
        </div>

        <button
          onClick={() => setShowTransferModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
        >
          <Building2 size={18} />
          <span>Request Blood from Hospital</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('ALL')}
          className={`btn ${activeTab === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '13px', padding: '8px 16px' }}
        >
          All Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('PATIENT')}
          className={`btn ${activeTab === 'PATIENT' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '13px', padding: '8px 16px' }}
        >
          Inpatient Requests ({requests.filter(r => r.requestType !== 'HOSPITAL_TRANSFER').length})
        </button>
        <button
          onClick={() => setActiveTab('TRANSFER')}
          className={`btn ${activeTab === 'TRANSFER' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '13px', padding: '8px 16px' }}
        >
          Inter-Hospital Transfers ({requests.filter(r => r.requestType === 'HOSPITAL_TRANSFER').length})
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading clinical requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            No requests found in this view.
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Type & Requester</th>
                  <th>Fulfilling Hospital</th>
                  <th>Blood Group</th>
                  <th>Units</th>
                  <th>Urgency</th>
                  <th>Clinical Reason</th>
                  <th>Status</th>
                  <th>Hospital Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => {
                  const isTransfer = req.requestType === 'HOSPITAL_TRANSFER';
                  const isOutgoing = isTransfer && user?.hospitalId && req.requestingHospitalId === user.hospitalId;

                  return (
                    <tr key={req.requestId}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>
                          #{req.requestId.slice(-8)}
                        </span>
                      </td>
                      <td>
                        {isTransfer ? (
                          <div>
                            <span className="badge badge-info" style={{ fontSize: '10px', marginBottom: '4px' }}>
                              {isOutgoing ? 'OUTGOING TRANSFER' : 'INCOMING TRANSFER'}
                            </span>
                            <div>
                              <strong>{req.requestingHospital?.name || 'Partner Hospital'}</strong>
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{req.requestingHospital?.city || 'Hospital Network'}</div>
                          </div>
                        ) : (
                          <div>
                            <span className="badge badge-success" style={{ fontSize: '10px', marginBottom: '4px' }}>INPATIENT</span>
                            <div><strong>{req.patient?.user?.name}</strong></div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{req.patient?.medicalId || 'Patient'}</div>
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>{req.hospital?.name}</strong>
                      </td>
                      <td>
                        <span className="badge badge-danger">
                          {req.bloodGroup.replace('_', '+')}
                        </span>
                      </td>
                      <td>{req.quantity} Unit(s)</td>
                      <td>
                        <span className={`badge ${req.urgency === 'EMERGENCY' ? 'badge-danger' : req.urgency === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>
                          {req.urgency}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: '#475569' }}>
                          {req.reason}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${req.status === 'FULFILLED' ? 'badge-success' : req.status === 'APPROVED' ? 'badge-info' : req.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        {req.status === 'PENDING' ? (
                          isOutgoing ? (
                            <span style={{ fontSize: '12px', color: '#b45309', fontWeight: '600' }}>
                              Awaiting Approval
                            </span>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleAction(req.requestId, 'APPROVE')}
                                className="btn btn-success btn-sm"
                              >
                                Approve & Reserve
                              </button>
                              <button
                                onClick={() => handleAction(req.requestId, 'REJECT')}
                                className="btn btn-danger btn-sm"
                              >
                                Decline
                              </button>
                            </div>
                          )
                        ) : req.status === 'APPROVED' ? (
                          isOutgoing ? (
                            <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: '600' }}>
                              Approved & Reserved
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAction(req.requestId, 'FULFILL')}
                              className="btn btn-primary btn-sm"
                            >
                              <span>{isTransfer ? 'Fulfill & Transfer Stock' : 'Issue Units to Ward'}</span>
                            </button>
                          )
                        ) : (
                          <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                            ✓ {isTransfer ? 'Transferred & Completed' : 'Completed & Issued'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inter-Hospital Request Modal */}
      {showTransferModal && (
        <RequestFromHospitalModal
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {
            fetchRequests();
          }}
        />
      )}
    </DashboardLayout>
  );
}
