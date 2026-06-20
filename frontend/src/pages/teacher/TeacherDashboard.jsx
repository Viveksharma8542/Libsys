import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Spinner } from '../../components/UI';
import api from '../../utils/api';

export default function TeacherDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teacher/dashboard').then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><Spinner /></Layout>;

  return (
    <Layout title="My Dashboard">
      <div className="page-header">
        <div><h2 className="page-title">My Dashboard</h2></div>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-label">Books Issued</div>
          <div className="stat-value">{data?.issuedBooks || 0}</div>
          <div className="stat-sub">currently holding</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-body">
          <h3 style={{ marginBottom: '12px' }}>📚 Library Information for Teachers</h3>
          <ul style={{ lineHeight: '1.8', color: 'var(--text-muted)' }}>
            <li><strong>No time limit</strong> - Teachers can keep books as long as needed</li>
            <li><strong>No fines</strong> - There are no late fees for teachers</li>
            <li>Contact the librarian to return books when needed</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
