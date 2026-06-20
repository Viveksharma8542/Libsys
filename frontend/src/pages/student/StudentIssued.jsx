import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Empty } from '../../components/UI';
import api from '../../utils/api';

export default function StudentIssued() {
  const [issued, setIssued]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/issued').then(r => setIssued(r.data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="My Books">
      <div className="page-header">
        <div><h2 className="page-title">My Issued Books</h2><p className="page-sub">Books currently with you</p></div>
      </div>
      <div className="card">
        {loading ? <Spinner /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Title</th><th>Author</th><th>Issue Date</th><th>Due Date</th><th>Status</th><th>Est. Fine</th></tr></thead>
              <tbody>
                {issued.length === 0 ? (
                  <tr><td colSpan={6}><Empty message="No books currently issued" /></td></tr>
                ) : issued.map(i => (
                  <tr key={i.id} className={i.is_overdue ? 'overdue-row' : ''}>
                    <td>
                      <strong>{i.title}</strong>
                      <div className="text-muted text-sm">{i.category}</div>
                    </td>
                    <td className="text-muted">{i.author}</td>
                    <td className="text-sm">{new Date(i.issue_date).toLocaleDateString()}</td>
                    <td className="text-sm">
                      {new Date(i.due_date).toLocaleDateString()}
                    </td>
                    <td>
                      {i.is_overdue
                        ? <span className="badge badge-red">⚠ {i.days_overdue} days overdue</span>
                        : <span className="badge badge-green">On time</span>}
                    </td>
                    <td className="font-mono">
                      {i.is_overdue
                        ? <strong style={{ color: 'var(--accent)' }}>₹{i.estimated_fine.toFixed(2)}</strong>
                        : <span className="text-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
