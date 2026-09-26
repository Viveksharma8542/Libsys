import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Alert, Pagination, Empty, StatusBadge } from '../../components/UI';
import api from '../../utils/api';

export default function LibrarianFines() {
  const [fines, setFines]     = useState([]);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [alert, setAlert]     = useState(null);
  const [marking, setMarking] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: 20 });
    if (statusFilter) p.set('status', statusFilter);
    api.get(`/librarian/fines?${p}`)
      .then(r => { setFines(r.data.data); setMeta(r.data.meta); })
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const markPaid = async (id) => {
    setMarking(id);
    try {
      await api.post(`/librarian/fines/${id}/paid`);
      setAlert({ type: 'success', msg: 'Fine marked as paid' });
      load();
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.message || 'Failed' });
    } finally { setMarking(null); }
  };

  const pendingFines = fines.filter(f => f.status === 'pending');
  const totalPending = pendingFines.reduce((sum, f) => sum + parseFloat(f.amount), 0);

  return (
    <Layout title="Fines">
      <div className="page-header">
        <div><h2 className="page-title">Fines</h2><p className="page-sub">Fines are calculated when a book is returned</p></div>
        {totalPending > 0 && (
          <div className="stat-card amber" style={{ margin: 0, padding: '10px 18px' }}>
            <div className="stat-label">Total Pending</div>
            <div className="stat-value" style={{ fontSize: 20 }}>₹{totalPending.toFixed(2)}</div>
          </div>
        )}
      </div>
      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.msg}</Alert>}

      <div className="card">
        <div className="card-header">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ width: 130 }}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="waived">Waived</option>
          </select>
        </div>
        {loading ? <Spinner /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student</th><th>Book</th><th>Days Late</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {fines.length === 0 ? (
                    <tr><td colSpan={6}><Empty message="No recorded fines" /></td></tr>
                  ) : fines.map(f => (
                    <tr key={f.id}>
                      <td>{f.student_name}</td>
                      <td className="text-muted">{f.book_title}</td>
                      <td className="font-mono">{f.days_late}</td>
                      <td className="font-mono"><strong>₹{parseFloat(f.amount).toFixed(2)}</strong></td>
                      <td><StatusBadge status={f.status} /></td>
                      <td>
                        {f.status === 'pending' && (
                          <button className="btn btn-sm btn-success" disabled={marking === f.id}
                            onClick={() => markPaid(f.id)}>
                            {marking === f.id ? '…' : '✓ Mark Paid'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={meta} onPage={setPage} />
          </>
        )}
      </div>
    </Layout>
  );
}
