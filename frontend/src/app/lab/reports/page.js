'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FileText, Download, Printer, FlaskConical, CheckCircle2 } from 'lucide-react';

export default function LabReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports?type=LAB_TESTING')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReport(data.report);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!report?.details) return;
    const headers = ['Unit ID,Blood Group,Component,HIV Test,HBV Test,HCV Test,Syphilis,Test Status\n'];
    const rows = report.details.map(u =>
      `"${u.bloodUnitId}","${u.bloodGroup}","${u.componentType}","${u.hivTest}","${u.hbvTest}","${u.hcvTest}","${u.syphilisTest}","${u.testStatus}"`
    );
    const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab_compliance_report_${Date.now()}.csv`;
    a.click();
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={24} color="#4f46e5" />
            <span>Laboratory Testing & Screening Compliance Report</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Immunohematology infectious disease clearance and quality assurance audit.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button onClick={handlePrint} className="btn btn-secondary btn-sm">
            <Printer size={16} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
          Generating laboratory compliance audit...
        </div>
      ) : report ? (
        <div>
          {/* Metrics summary */}
          <div className="grid-3" style={{ marginBottom: '24px' }}>
            <div className="card">
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Total Units Screened</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>{report.totalScreened}</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Pathogen Free Pass Rate</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#059669' }}>{report.passedRate}</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Biohazard Flags</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#dc2626' }}>{report.pathogenDetectedCount}</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Tested Units Detail Log</h3>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Unit ID</th>
                    <th>Hospital</th>
                    <th>Verified Group</th>
                    <th>Component</th>
                    <th>HIV Screening</th>
                    <th>Hepatitis B</th>
                    <th>Hepatitis C</th>
                    <th>Syphilis</th>
                    <th>Test Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.details?.map((u) => (
                    <tr key={u.bloodUnitId}>
                      <td>#{u.bloodUnitId.slice(-8)}</td>
                      <td>{u.bloodBank?.hospital?.name}</td>
                      <td>{u.verifiedGroup?.replace('_', '+') || u.bloodGroup?.replace('_', '+')}</td>
                      <td>{u.componentType}</td>
                      <td><span className="badge badge-success">{u.hivTest}</span></td>
                      <td><span className="badge badge-success">{u.hbvTest}</span></td>
                      <td><span className="badge badge-success">{u.hcvTest}</span></td>
                      <td><span className="badge badge-success">{u.syphilisTest}</span></td>
                      <td><span className="badge badge-success">{u.testStatus}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
