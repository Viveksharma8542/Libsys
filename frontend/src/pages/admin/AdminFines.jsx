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
  const [alert, setAlert]     = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/admin/fines?page=${page}&limit=20`)
      .then(r => { setFines(r.data.data || []); setMeta(r.data.meta); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

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

  const pendingFines = fines.filter(f => f.status === 'pending');
  const totalPending = pendingFines.reduce((sum, f) => sum + parseFloat(f.amount), 0);

  return (
    <Layout title="Fines">
      <div className="page-header">
        <div><h2 className="page-title">Fine Management</h2><p className="page-sub">Admin can modify fine amounts · fines are calculated when a book is returned</p></div>
        {totalPending > 0 && (
          <div className="stat-card amber" style={{ margin: 0, padding: '10px 18px' }}>
            <div className="stat-label">Total Pending</div>
            <div className="stat-value" style={{ fontSize: 20 }}>₹{totalPending.toFixed(2)}</div>
          </div>
        )}
      </div>
      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.msg}</Alert>}

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
