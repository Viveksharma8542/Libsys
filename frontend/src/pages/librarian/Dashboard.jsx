import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Spinner } from '../../components/UI';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

  const CATEGORY_COLORS = ['#064c37', '#43a1d7', '#b8620a', '#292229', '#e8622a', '#2f8f8a', '#7b4b94', '#8c2f39'];

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
          <div className="stat-label">Total No. of Copies</div>
          <div className="stat-value">{totalCopies}</div>
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

      <div className="card" style={{ maxWidth: 520 }}>
        <div className="card-header"><span className="card-title">Collection by Category</span></div>
        <div className="card-body">
          {data.byCategory && data.byCategory.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.byCategory}
                  dataKey="copies"
                  nameKey="category"
                  innerRadius={62}
                  outerRadius={98}
                  paddingAngle={2}
                >
                  {data.byCategory.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-sm">No categorized books yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
