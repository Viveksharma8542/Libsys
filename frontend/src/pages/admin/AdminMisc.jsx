import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Alert, Modal, Pagination, Empty, StatusBadge } from '../../components/UI';
import api from '../../utils/api';

// ── Admin Fines ───────────────────────────────────────────────────────────────
export function AdminFines() {
  const [fines, setFines]     = useState([]);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [editFine, setEditFine] = useState(null);
  const [editAmt, setEditAmt]   = useState('');
  const [editNote, setEditNote] = useState('');
  const [saving, setSaving]     = useState(false);
  const [alert, setAlert]       = useState(null);

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

  return (
    <Layout title="Fines">
      <div className="page-header">
        <div><h2 className="page-title">Fine Management</h2><p className="page-sub">Admin can modify fine amounts</p></div>
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

// ── System Config ─────────────────────────────────────────────────────────────
export function AdminConfig() {
  const [configs, setConfigs]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState({});
  const [saving, setSaving]     = useState(null);
  const [alert, setAlert]       = useState(null);

  useEffect(() => {
    api.get('/admin/config').then(r => setConfigs(r.data.data)).finally(() => setLoading(false));
  }, []);

  const save = async (key) => {
    setSaving(key);
    try {
      await api.put('/admin/config', { key, value: editing[key] });
      setConfigs(c => c.map(x => x.key === key ? { ...x, value: editing[key] } : x));
      setAlert({ type: 'success', msg: `Config "${key}" updated` });
    } catch { setAlert({ type: 'error', msg: 'Failed to update' }); }
    finally { setSaving(null); }
  };

  const CONFIG_LABELS = {
    issue_duration_days:    { label: 'Issue Duration (days)',      desc: 'How many days a book can be issued' },
    fine_per_day:           { label: 'Fine Per Day (₹)',           desc: 'Fine amount charged per late day' },
    max_books_per_student:  { label: 'Max Books Per Student',      desc: 'Maximum books a student can hold' },
    cooldown_days:          { label: 'Reissue Cooldown (days)',    desc: 'Days before same book can be reissued' },
  };

  return (
    <Layout title="System Config">
      <div className="page-header">
        <div><h2 className="page-title">System Configuration</h2><p className="page-sub">Library rules & fine settings</p></div>
      </div>
      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.msg}</Alert>}
      {loading ? <Spinner /> : (
        <div style={{ maxWidth: 560 }}>
          {configs.map(c => {
            const info = CONFIG_LABELS[c.key] || { label: c.key, desc: c.description };
            const val  = editing[c.key] !== undefined ? editing[c.key] : c.value;
            return (
              <div className="card" key={c.key} style={{ marginBottom: 12 }}>
                <div className="card-body">
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ fontSize: 14 }}>{info.label}</strong>
                    <p className="text-muted text-sm">{info.desc}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="number" min="0" value={val}
                      onChange={e => setEditing(prev => ({ ...prev, [c.key]: e.target.value }))}
                      style={{ width: 120 }} />
                    <button className="btn btn-primary btn-sm" onClick={() => save(c.key)}
                      disabled={saving === c.key || val === c.value}>
                      {saving === c.key ? 'Saving…' : 'Save'}
                    </button>
                    <span className="text-muted text-sm">Current: <strong className="font-mono">{c.value}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

// ── Audit Logs ────────────────────────────────────────────────────────────────
export function AdminAudit() {
  const [logs, setLogs]       = useState([]);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/audit-logs?page=${page}&limit=20`)
      .then(r => { setLogs(r.data.data); setMeta(r.data.meta); })
      .finally(() => setLoading(false));
  }, [page]);

  const ACTION_COLORS = {
    LOGIN: 'blue', LOGOUT: 'gray', ISSUE_BOOK: 'green',
    RETURN_BOOK: 'blue', REGISTER_USER: 'green', BLOCK_STUDENT: 'red',
    MODIFY_FINE: 'amber', MARK_FINE_PAID: 'green', DELETE_BOOK: 'red',
  };

  return (
    <Layout title="Audit Logs">
      <div className="page-header">
        <div><h2 className="page-title">Audit Logs</h2><p className="page-sub">All system actions are recorded</p></div>
      </div>
      <div className="card">
        {loading ? <Spinner /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Time</th><th>User</th><th>Role</th><th>Action</th><th>Entity</th><th>IP</th></tr></thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr><td colSpan={6}><Empty message="No logs" /></td></tr>
                  ) : logs.map(l => (
                    <tr key={l.id}>
                      <td className="text-sm font-mono text-muted">{new Date(l.created_at).toLocaleString()}</td>
                      <td>{l.user_name || '—'}</td>
                      <td><span className="badge badge-blue">{l.user_role}</span></td>
                      <td>
                        <span className={`badge badge-${ACTION_COLORS[l.action] || 'gray'}`}>{l.action}</span>
                      </td>
                      <td className="text-sm text-muted">{l.entity || '—'}</td>
                      <td className="text-sm font-mono text-muted">{l.ip_address || '—'}</td>
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

// ── Book Requests ─────────────────────────────────────────────────────────────
export function AdminBookRequests() {
  const [requests, setRequests] = useState([]);
  const [meta, setMeta]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/book-requests?page=${page}&limit=20`)
      .then(r => { setRequests(r.data.data); setMeta(r.data.meta); })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <Layout title="Book Requests">
      <div className="page-header">
        <div><h2 className="page-title">Book Requests</h2><p className="page-sub">Student demand list</p></div>
      </div>
      <div className="card">
        {loading ? <Spinner /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student</th><th>Book Name</th><th>Author</th><th>Reason</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr><td colSpan={6}><Empty message="No requests" /></td></tr>
                  ) : requests.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div>{r.student_name}</div>
                        <div className="text-muted text-sm">{r.enrollment_no}</div>
                      </td>
                      <td><strong>{r.book_name}</strong></td>
                      <td className="text-muted">{r.author || '—'}</td>
                      <td className="text-muted text-sm">{r.reason || '—'}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td className="text-sm text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
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
