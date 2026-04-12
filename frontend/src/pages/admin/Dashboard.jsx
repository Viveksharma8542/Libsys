import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Spinner } from '../../components/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../utils/api';

export default function AdminDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><Spinner /></Layout>;
  if (!data)   return <Layout title="Dashboard"><p>Failed to load.</p></Layout>;

  const barData = [
    { name: 'Total Books',  value: data.books.total },
    { name: 'Available',    value: data.books.available },
    { name: 'Issued',       value: data.issued },
    { name: 'Overdue',      value: data.overdue },
  ];
  const pieData = [
    { name: 'Librarians', value: data.users.librarian || 0 },
    { name: 'Students',   value: data.users.student   || 0 },
  ];
  const COLORS = ['#1a3a5c', '#6eb3e8'];

  return (
    <Layout title="Dashboard">
      <div className="page-header">
        <div>
          <h2 className="page-title">Admin Dashboard</h2>
          <p className="page-sub">System overview</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-label">Total Books</div>
          <div className="stat-value">{data.books.total}</div>
          <div className="stat-sub">{data.books.available} available</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Issued Books</div>
          <div className="stat-value">{data.issued}</div>
          <div className="stat-sub">currently out</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Overdue</div>
          <div className="stat-value">{data.overdue}</div>
          <div className="stat-sub">need follow-up</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Pending Fines</div>
          <div className="stat-value">₹{data.pendingFines.total}</div>
          <div className="stat-sub">{data.pendingFines.count} records</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Librarians</div>
          <div className="stat-value">{data.users.librarian || 0}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Students</div>
          <div className="stat-value">{data.users.student || 0}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Book Requests</div>
          <div className="stat-value">{data.bookRequests}</div>
          <div className="stat-sub">pending requests</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Book Inventory</span></div>
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
        <div className="card">
          <div className="card-header"><span className="card-title">User Distribution</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={65} label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
}
