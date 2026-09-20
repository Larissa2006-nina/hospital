'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FileText, Download, Printer, Filter } from 'lucide-react';

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('BLOOD_BANK');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${reportType}`);
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    if (!report?.details) return;
    const blob = new Blob([JSON.stringify(report.details, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_report_${reportType.toLowerCase()}_${Date.now()}.json`;
    a.click();
  };

  const categories = [
    { id: 'BLOOD_BANK', label: 'Blood Bank Inventory' },
    { id: 'DONATION', label: 'Donations & Phlebotomy' },
    { id: 'DONOR', label: 'Registered Donors' },
    { id: 'BLOOD_REQUEST', label: 'Patient Requests' },
    { id: 'EMERGENCY', label: 'Emergency Alerts' },
    { id: 'FINANCIAL', label: 'Financial Transactions' },
    { id: 'LAB_TESTING', label: 'Laboratory Screenings' },
  ];

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={24} color="#dc2626" />
            <span>Executive System Reports & Analytics</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Comprehensive reporting across clinical supply, donor demographics, emergency responsiveness, and financial ledger.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm">
            <Download size={16} />
            <span>Export JSON / CSV</span>
          </button>
          <button onClick={handlePrint} className="btn btn-secondary btn-sm">
            <Printer size={16} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: reportType === tab.id ? '2px solid #dc2626' : '1px solid #e2e8f0',
              backgroundColor: reportType === tab.id ? '#fee2e2' : '#ffffff',
              color: reportType === tab.id ? '#991b1b' : '#475569',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Generating {reportType} report...</div>
        ) : report ? (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: '#0f172a' }}>
              {report.title}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {Object.entries(report).map(([key, val]) => {
                if (key === 'title' || key === 'details') return null;
                return (
                  <div key={key} style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1')}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                      {typeof val === 'number' && key.toLowerCase().includes('usd') ? `$${val.toFixed(2)}` : String(val)}
                    </div>
                  </div>
                );
              })}
            </div>

            <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: '#334155' }}>
              Audit Breakdown ({report.details?.length || 0} Records)
            </h4>

            <div style={{ background: '#0f172a', color: '#f8fafc', borderRadius: '10px', padding: '16px', maxHeight: '340px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px' }}>
              <pre>{JSON.stringify(report.details, null, 2)}</pre>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
