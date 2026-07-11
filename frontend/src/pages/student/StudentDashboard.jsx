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

  return (
    <Layout title="My Dashboard">
      <div className="page-header">
        <div><h2 className="page-title">My Dashboard</h2></div>
      </div>

      {data?.isBlocked && (
        <div className="alert alert-error">🚫 Your account is blocked. Contact the librarian.</div>
      )}

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-label">Books Issued</div>
          <div className="stat-value">{data?.issuedBooks || 0}</div>
          <div className="stat-sub">currently holding</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Overdue Books</div>
          <div className="stat-value">{data?.overdueBooks || 0}</div>
          <div className="stat-sub">return immediately</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Pending Fine</div>
          <div className="stat-value">₹{parseFloat(data?.pendingFine || 0).toFixed(2)}</div>
          <div className="stat-sub">recorded + estimated overdue</div>
        </div>
      </div>
    </Layout>
  );
}
