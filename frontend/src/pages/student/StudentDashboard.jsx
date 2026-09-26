import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Spinner } from '../../components/UI';
import api from '../../utils/api';

export default function StudentDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/dashboard').then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><Spinner /></Layout>;

  const tiles = [
    { label: 'Books Issued',  value: data?.issuedBooks || 0,                                sub: 'currently holding',           icon: '📚', accent: '#1573ad', tint: '#e7f3fa' },
    { label: 'Overdue Books', value: data?.overdueBooks || 0,                               sub: 'return immediately',          icon: '⚠️', accent: '#c8392b', tint: '#fbeeea' },
    { label: 'Pending Fine',  value: `₹${parseFloat(data?.pendingFine || 0).toFixed(2)}`,   sub: 'unpaid fines', icon: '💰', accent: '#b8620a', tint: '#fdf4e8' },
  ];

  return (
    <Layout title="My Dashboard">
      <div className="page-header">
        <div><h2 className="page-title">My Dashboard</h2></div>
      </div>

      {data?.isBlocked && (
        <div className="alert alert-error">🚫 Your account is blocked. Contact the librarian.</div>
      )}

      <div className="tile-grid">
        {tiles.map(t => (
          <div className="tile" key={t.label} style={{ '--tile-accent': t.accent, '--tile-tint': t.tint }}>
            <div className="tile-icon">{t.icon}</div>
            <div className="tile-value">{t.value}</div>
            <div className="tile-label">{t.label}</div>
            <div className="tile-sub">{t.sub}</div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
