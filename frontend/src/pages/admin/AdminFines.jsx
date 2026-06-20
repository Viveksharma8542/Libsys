import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Alert, Modal, Pagination, Empty, StatusBadge } from '../../components/UI';
import api from '../../utils/api';

export default function AdminFines() {
  const [fines, setFines]     = useState([]);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [editFine, setEditFine] = useState(null);
  const [editAmt, setEditAmt]   = useState('');
  const [editNote, setEditNote] = useState('');
  const [saving, setSaving]     = useState(false);
  const [alert, setAlert]       = useState(null);
  const [overdue, setOverdue]   = useState([]);
  const [overdueLoading, setOverdueLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/admin/fines?page=${page}&limit=20`)
      .then(r => { setFines(r.data.data || []); setMeta(r.data.meta); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get('/admin/fines/overdue')
      .then(r => setOverdue(r.data.data || []))
      .finally(() => setOverdueLoading(false));
  }, []);

  const openEdit = (f) => { setEditFine(f); setEditAmt(f.amount); setEditNote(f.notes || ''); };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/fines/${editFine.id}`, { amount: parseFloat(editAmt), notes: editNote });
      setAlert({ type: 'success', msg: 'Fine updated' });
      setEditFine(null); load();
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.message || 'Failed' });
    } finally { setSaving(false); }
  };

  const totalRecordedPending = fines.filter(f => f.status === 'pending').reduce((sum, f) => sum + parseFloat(f.amount), 0);
  const totalOverdueEstimated = overdue.reduce((sum, o) => sum + o.estimated_fine, 0);
  const grandTotal = totalRecordedPending + totalOverdueEstimated;

  return (
    <Layout title="Fines">
      <div className="page-header">
        <div><h2 className="page-title">Fine Management</h2><p className="page-sub">Admin can modify fine amounts and view overdue charges</p></div>
      </div>
      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.msg}</Alert>}

      {overdue.length > 0 && (
        <div className="alert alert-amber" style={{ marginBottom: 12 }}>
          ⚠️ {overdue.length} book(s) currently overdue with estimated fines of ₹{totalOverdueEstimated.toFixed(2)}.
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card amber">
          <div className="stat-label">Recorded Pending</div>
          <div className="stat-value">₹{totalRecordedPending.toFixed(2)}</div>
          <div className="stat-sub">{fines.filter(f => f.status === 'pending').length} fine(s)</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Live Overdue Est.</div>
          <div className="stat-value">₹{totalOverdueEstimated.toFixed(2)}</div>
          <div className="stat-sub">{overdue.length} book(s) overdue</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Grand Total</div>
          <div className="stat-value">₹{grandTotal.toFixed(2)}</div>
          <div className="stat-sub">combined pending</div>
        </div>
      </div>

      <h3 style={{ fontSize: 15, marginBottom: 8 }}>Live Overdue Books (Est. Fines)</h3>
      <div className="card" style={{ marginBottom: 16 }}>
        {overdueLoading ? <Spinner /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Student</th><th>Book</th><th>Issue Date</th><th>Due Date</th><th>Days Overdue</th><th>Est. Fine</th><th>Status</th></tr></thead>
              <tbody>
                {overdue.length === 0 ? (
                  <tr><td colSpan={7}><Empty message="No overdue books" /></td></tr>
                ) : overdue.map(o => (
                  <tr key={o.issued_book_id} className="overdue-row">
                    <td>
                      <div>{o.student_name}</div>
                      <div className="text-muted text-sm font-mono">{o.enrollment_no}</div>
                    </td>
                    <td>
                      <div>{o.book_title}</div>
                      <div className="text-muted text-sm font-mono">{o.isbn}</div>
                    </td>
                    <td className="text-sm">{new Date(o.issue_date).toLocaleDateString()}</td>
                    <td className="text-sm">{new Date(o.due_date).toLocaleDateString()}</td>
                    <td className="font-mono"><strong>{o.days_overdue} days</strong></td>
                    <td className="font-mono"><strong style={{ color: 'var(--accent)' }}>₹{o.estimated_fine.toFixed(2)}</strong></td>
                    <td><StatusBadge status="accumulating" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h3 style={{ fontSize: 15, marginBottom: 8 }}>Recorded Fines</h3>
      <div className="card">
        {loading ? <Spinner /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student</th><th>Book</th><th>Days Late</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {fines.length === 0 ? (
                    <tr><td colSpan={6}><Empty message="No fines" /></td></tr>
                  ) : fines.map(f => (
                    <tr key={f.id}>
                      <td>{f.student_name}</td>
                      <td className="text-muted">{f.book_title}</td>
                      <td className="font-mono">{f.days_late}</td>
                      <td className="font-mono"><strong>₹{parseFloat(f.amount).toFixed(2)}</strong></td>
                      <td><StatusBadge status={f.status} /></td>
                      <td>
                        {f.status === 'pending' && (
                          <button className="btn btn-sm btn-outline" onClick={() => openEdit(f)}>Edit</button>
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

      {editFine && (
        <Modal title="Modify Fine" onClose={() => setEditFine(null)}
          footer={<>
            <button className="btn btn-outline" onClick={() => setEditFine(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>}>
          <p className="text-muted text-sm" style={{ marginBottom: 14 }}>
            Student: <strong>{editFine.student_name}</strong> · Book: <strong>{editFine.book_title}</strong>
          </p>
          <div className="form-group">
            <label>Fine Amount (₹)</label>
            <input type="number" min="0" step="0.01" value={editAmt} onChange={e => setEditAmt(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={3} />
          </div>
        </Modal>
      )}
    </Layout>
  );
}
