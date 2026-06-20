import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Empty, StatusBadge } from '../../components/UI';
import api from '../../utils/api';

export default function StudentFines() {
  const [fines, setFines]       = useState([]);
  const [totalPending, setTotal] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [overdueBooks, setOverdue] = useState([]);

  useEffect(() => {
    api.get('/student/fines')
      .then(r => { setFines(r.data.data); setTotal(r.data.totalPending || 0); })
      .finally(() => setLoading(false));
    api.get('/student/issued')
      .then(r => setOverdue(r.data.data.filter(b => b.is_overdue)))
      .catch(() => {});
  }, []);

  const estimatedTotal = overdueBooks.reduce((sum, b) => sum + b.estimated_fine, 0);
  const grandTotal = totalPending + estimatedTotal;

  return (
    <Layout title="My Fines">
      <div className="page-header">
        <div><h2 className="page-title">My Fines</h2></div>
        {grandTotal > 0 && (
          <div className="stat-card amber" style={{ margin: 0, padding: '10px 16px' }}>
            <div className="stat-label">Total Pending + Estimated</div>
            <div className="stat-value" style={{ fontSize: 20 }}>₹{grandTotal.toFixed(2)}</div>
          </div>
        )}
      </div>

      {overdueBooks.length > 0 && (
        <div className="alert alert-amber" style={{ marginBottom: 16 }}>
          ⚠️ You have {overdueBooks.length} overdue book(s) with estimated fines of ₹{estimatedTotal.toFixed(2)}. Return them ASAP to avoid further charges!
        </div>
      )}

      {overdueBooks.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">Estimated Fines (Overdue Books)</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Book</th><th>Due Date</th><th>Days Overdue</th><th>Est. Fine</th></tr></thead>
              <tbody>
                {overdueBooks.map(b => (
                  <tr key={b.id} className="overdue-row">
                    <td><strong>{b.title}</strong></td>
                    <td className="text-sm">{new Date(b.due_date).toLocaleDateString()}</td>
                    <td className="font-mono">{b.days_overdue} days</td>
                    <td className="font-mono"><strong style={{ color: 'var(--accent)' }}>₹{b.estimated_fine.toFixed(2)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
