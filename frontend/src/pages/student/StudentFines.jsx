import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Empty, StatusBadge } from '../../components/UI';
import api from '../../utils/api';

export default function StudentFines() {
  const [fines, setFines]       = useState([]);
  const [totalPending, setTotal] = useState(0);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/student/fines')
      .then(r => { setFines(r.data.data); setTotal(r.data.totalPending || 0); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="My Fines">
      <div className="page-header">
        <div><h2 className="page-title">My Fines</h2><p className="page-sub">Fines are calculated when a book is returned</p></div>
        {totalPending > 0 && (
          <div className="stat-card amber" style={{ margin: 0, padding: '10px 16px' }}>
            <div className="stat-label">Total Pending</div>
            <div className="stat-value" style={{ fontSize: 20 }}>₹{parseFloat(totalPending).toFixed(2)}</div>
          </div>
        )}
      </div>

      {totalPending > 0 && (
        <div className="alert alert-amber">
          💡 You have pending fines totalling ₹{parseFloat(totalPending).toFixed(2)}. Please pay at the library counter.
        </div>
      )}
      <div className="card">
        <div className="card-header"><span className="card-title">Recorded Fines</span></div>
        {loading ? <Spinner /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Book</th><th>Issue Date</th><th>Due Date</th><th>Return Date</th><th>Days Late</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {fines.length === 0 ? (
                  <tr><td colSpan={7}><Empty icon="✅" message="No recorded fines" /></td></tr>
                ) : fines.map(f => (
                  <tr key={f.id}>
                    <td><strong>{f.book_title}</strong></td>
                    <td className="text-sm">{new Date(f.issue_date).toLocaleDateString()}</td>
                    <td className="text-sm">{new Date(f.due_date).toLocaleDateString()}</td>
                    <td className="text-sm">{f.return_date ? new Date(f.return_date).toLocaleDateString() : '—'}</td>
                    <td className="font-mono">{f.days_late}</td>
                    <td className="font-mono"><strong>₹{parseFloat(f.amount).toFixed(2)}</strong></td>
                    <td><StatusBadge status={f.status} /></td>
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
