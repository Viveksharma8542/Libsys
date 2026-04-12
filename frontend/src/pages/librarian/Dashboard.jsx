import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Spinner } from '../../components/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';

export default function LibrarianDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/librarian/dashboard').then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><Spinner /></Layout>;
  if (!data)   return <Layout title="Dashboard"><p>Failed to load.</p></Layout>;

  const barData = [
    { name: 'Total',     value: data.totalBooks },
    { name: 'Available', value: data.availableBooks },
    { name: 'Issued',    value: data.issuedBooks },
    { name: 'Overdue',   value: data.overdueBooks },
  ];

  return (
    <Layout title="Librarian Dashboard">
      <div className="page-header">
        <div><h2 className="page-title">Library Overview</h2><p className="page-sub">Today's status</p></div>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-label">Total Books</div>
          <div className="stat-value">{data.totalBooks}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Available</div>
          <div className="stat-value">{data.availableBooks}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Issued</div>
          <div className="stat-value">{data.issuedBooks}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Overdue</div>
          <div className="stat-value">{data.overdueBooks}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Pending Fines</div>
          <div className="stat-value">₹{parseFloat(data.pendingFines || 0).toFixed(0)}</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 500 }}>
        <div className="card-header"><span className="card-title">Book Status</span></div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#1a3a5c" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
}
