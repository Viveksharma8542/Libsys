import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Spinner } from '../../components/UI';
import api from '../../utils/api';

export default function LibrarianDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/librarian/dashboard').then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><Spinner /></Layout>;
  if (!data)   return <Layout title="Dashboard"><p>Failed to load.</p></Layout>;

  const totalCopies = data.totalCopies ?? data.totalBooks;

  const tiles = [
    { label: 'Total Books',         value: data.totalBooks,                                        sub: 'titles in the catalog',      icon: '📚', accent: '#1573ad', tint: '#e7f3fa' },
    { label: 'Total No. of Copies', value: totalCopies,                                            sub: 'physical copies on shelves', icon: '📖', accent: '#064c37', tint: '#e2efe8' },
    { label: 'Issued',              value: data.issuedBooks,                                       sub: 'currently borrowed',         icon: '📤', accent: '#b8620a', tint: '#fdf4e8' },
    { label: 'Overdue',             value: data.overdueBooks,                                      sub: 'past due date',              icon: '⚠️', accent: '#c8392b', tint: '#fbeeea' },
    { label: 'Pending Fines',       value: `₹${parseFloat(data.pendingFines || 0).toFixed(0)}`,    sub: 'awaiting collection',        icon: '💰', accent: '#292229', tint: '#ece7ec' },
  ];

  return (
    <Layout title="Librarian Dashboard">
      <div className="page-header">
        <div><h2 className="page-title">Library Overview</h2><p className="page-sub">Today's status</p></div>
      </div>

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
