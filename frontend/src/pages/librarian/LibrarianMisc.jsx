import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Alert, Modal, Pagination, Empty, StatusBadge } from '../../components/UI';
import api from '../../utils/api';

// ── Issue Book ────────────────────────────────────────────────────────────────
export function IssueBook() {
  const [students, setStudents] = useState([]);
  const [books, setBooks]       = useState([]);
  const [form, setForm]         = useState({ student_id: '', book_id: '', due_days: '' });
  const [loading, setLoading]   = useState(false);
  const [loadData, setLoadData] = useState(true);
  const [alert, setAlert]       = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/librarian/students?limit=100'),
      api.get('/librarian/books?limit=200'),
    ]).then(([s, b]) => {
      setStudents(s.data.data);
      setBooks(b.data.data.filter(bk => bk.available_copies > 0));
    }).finally(() => setLoadData(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!form.student_id || !form.book_id) { setAlert({ type: 'error', msg: 'Select student and book' }); return; }
    setLoading(true);
    try {
      // Coerce and validate IDs before sending to backend
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const studentId = form.student_id?.toString().trim();
      const bookId = form.book_id?.toString().trim();
      if (!uuidRe.test(studentId)) { throw { response: { data: { message: 'Validation failed', errors: [{ field: 'student_id', message: 'Invalid UUID' }] } } }; }
      if (!uuidRe.test(bookId)) { throw { response: { data: { message: 'Validation failed', errors: [{ field: 'book_id', message: 'Invalid UUID' }] } } }; }

      const payload = { student_id: studentId, book_id: bookId };
      if (form.due_days && form.due_days.toString().trim() !== '') payload.due_days = Number(form.due_days);

      await api.post('/librarian/issue', payload);
      setAlert({ type: 'success', msg: 'Book issued successfully!' });
      setForm({ student_id: '', book_id: '', due_days: '' });
      // Refresh books list
      api.get('/librarian/books?limit=200').then(b => setBooks(b.data.data.filter(bk => bk.available_copies > 0)));
    } catch (e) {
      // Show detailed validation errors when available
      let msg = e.response?.data?.message || 'Issue failed';
      if (e.response?.data?.errors && Array.isArray(e.response.data.errors) && e.response.data.errors.length) {
        const details = e.response.data.errors.map(err => `${err.field}: ${err.message}`).join('; ');
        msg = `${msg} — ${details}`;
      }
      console.error('Issue error:', e.response || e.message);
      setAlert({ type: 'error', msg });
    } finally { setLoading(false); }
  };

  if (loadData) return <Layout title="Issue Book"><Spinner /></Layout>;

  return (
    <Layout title="Issue Book">
      <div className="page-header">
        <div><h2 className="page-title">Issue Book</h2><p className="page-sub">Issue a book to a student</p></div>
      </div>
      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.msg}</Alert>}

      <div className="card" style={{ maxWidth: 540 }}>
        <div className="card-header"><span className="card-title">Issue Form</span></div>
        <div className="card-body">
          <form onSubmit={handleIssue}>
            <div className="form-group">
              <label>Student *</label>
              <select value={form.student_id} onChange={e => set('student_id', e.target.value)} required>
                <option value="">— Select Student —</option>
                {students.map(s => (
                  <option key={s.id} value={s.id} disabled={s.is_blocked}>
                    {s.name} ({s.enrollment_no || s.email}){s.is_blocked ? ' [BLOCKED]' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Book *</label>
              <select value={form.book_id} onChange={e => set('book_id', e.target.value)} required>
                <option value="">— Select Book —</option>
                {books.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.title} — {b.author} (Avail: {b.available_copies})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Issue Duration (days) — leave blank for default</label>
              <input type="number" min="1" value={form.due_days}
                onChange={e => set('due_days', e.target.value)} placeholder="Default from config" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <><div className="spinner" /> Issuing…</> : '📤 Issue Book'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

// ── Issued Books List ─────────────────────────────────────────────────────────
export function IssuedBooks() {
  const [issued, setIssued]   = useState([]);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [alert, setAlert]     = useState(null);
  const [returning, setReturning] = useState(null);
  const [reissuing, setReissuing] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/librarian/issued?page=${page}&limit=20`)
      .then(r => { setIssued(r.data.data); setMeta(r.data.meta); })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleReturn = async (id) => {
    setReturning(id);
    try {
      const r = await api.post(`/librarian/return/${id}`);
      const { daysLate, fine } = r.data.data;
      const msg = daysLate > 0
        ? `Returned! ${daysLate} days late — Fine: ₹${fine}`
        : 'Book returned successfully!';
      setAlert({ type: daysLate > 0 ? 'amber' : 'success', msg });
      load();
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.message || 'Return failed' });
    } finally { setReturning(null); }
  };

  const handleReissue = async (id) => {
    setReissuing(id);
    try {
      await api.post(`/librarian/reissue/${id}`);
      setAlert({ type: 'success', msg: 'Book reissued!' });
      load();
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.message || 'Reissue failed' });
    } finally { setReissuing(null); }
  };

  return (
    <Layout title="Issued Books">
      <div className="page-header">
        <div><h2 className="page-title">Issued Books</h2><p className="page-sub">All currently issued books</p></div>
      </div>
      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.msg}</Alert>}
      <div className="card">
        {loading ? <Spinner /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Student</th><th>Book</th><th>Issue Date</th><th>Due Date</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {issued.length === 0 ? (
                    <tr><td colSpan={6}><Empty message="No books currently issued" /></td></tr>
                  ) : issued.map(i => (
                    <tr key={i.id} className={i.is_overdue ? 'overdue-row' : ''}>
                      <td>
                        <div>{i.student_name}</div>
                        <div className="text-muted text-sm">{i.enrollment_no}</div>
                      </td>
                      <td>
                        <div>{i.title}</div>
                        <div className="font-mono text-sm text-muted">{i.isbn}</div>
                      </td>
                      <td className="text-sm">{new Date(i.issue_date).toLocaleDateString()}</td>
                      <td className="text-sm">
                        {new Date(i.due_date).toLocaleDateString()}
                        {i.is_overdue && <span className="badge badge-red" style={{ marginLeft: 4 }}>Overdue</span>}
                      </td>
                      <td>{i.reissue_count > 0 && <span className="badge badge-amber">Reissued ×{i.reissue_count}</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm btn-success"
                            disabled={returning === i.id}
                            onClick={() => handleReturn(i.id)}>
                            {returning === i.id ? '…' : 'Return'}
                          </button>
                          <button className="btn btn-sm btn-outline"
                            disabled={reissuing === i.id}
                            onClick={() => handleReissue(i.id)}>
                            {reissuing === i.id ? '…' : 'Reissue'}
                          </button>
                        </div>
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

// ── Students List + Profile ────────────────────────────────────────────────────
export function LibrarianStudents() {
  const [students, setStudents] = useState([]);
  const [meta, setMeta]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [profile, setProfile]   = useState(null);
  const [profLoading, setProfLoading] = useState(false);
  const [alert, setAlert]       = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: 15 });
    if (search) p.set('search', search);
    api.get(`/librarian/students?${p}`)
      .then(r => { setStudents(r.data.data); setMeta(r.data.meta); })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const viewProfile = (id) => {
    setProfLoading(true);
    api.get(`/librarian/students/${id}`)
      .then(r => setProfile(r.data.data))
      .finally(() => setProfLoading(false));
  };

  const toggleBlock = async (studentId, block, reason = '') => {
    try {
      await api.patch(`/librarian/students/${studentId}/block`, { block, reason });
      setAlert({ type: 'success', msg: block ? 'Student blocked' : 'Student unblocked' });
      if (profile?.id === studentId) {
        setProfile(p => ({ ...p, is_blocked: block }));
      }
      load();
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.message || 'Failed' });
    }
  };

  return (
    <Layout title="Students">
      <div className="page-header">
        <div><h2 className="page-title">Students</h2><p className="page-sub">View profiles, manage access</p></div>
      </div>
      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.msg}</Alert>}

      <div className="card">
        <div className="card-header">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input placeholder="Name, email, enrollment…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>
        {loading ? <Spinner /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Enrollment</th><th>Course</th><th>Active Issues</th><th>Pending Fine</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan={7}><Empty message="No students" /></td></tr>
                  ) : students.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div>{s.name}</div>
                        <div className="text-muted text-sm">{s.email}</div>
                      </td>
                      <td className="font-mono text-sm">{s.enrollment_no || '—'}</td>
                      <td className="text-sm">{s.course || '—'} {s.semester ? `(${s.semester})` : ''}</td>
                      <td className="font-mono">{s.active_issues}</td>
                      <td className="font-mono">
                        {parseFloat(s.pending_fines) > 0
                          ? <span style={{ color: 'var(--accent)' }}>₹{parseFloat(s.pending_fines).toFixed(2)}</span>
                          : '—'}
                      </td>
                      <td>{s.is_blocked ? <span className="badge badge-red">Blocked</span> : <span className="badge badge-green">Active</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm btn-outline" onClick={() => viewProfile(s.id)}>View</button>
                          <button
                            className={`btn btn-sm ${s.is_blocked ? 'btn-success' : 'btn-danger'}`}
                            onClick={() => toggleBlock(s.id, !s.is_blocked, s.is_blocked ? '' : 'Bad record')}>
                            {s.is_blocked ? 'Unblock' : 'Block'}
                          </button>
                        </div>
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

      {/* Student Profile Modal */}
      {(profile || profLoading) && (
        <Modal title="Student Profile" onClose={() => setProfile(null)}
          footer={<button className="btn btn-outline" onClick={() => setProfile(null)}>Close</button>}>
          {profLoading ? <Spinner /> : profile && (
            <div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <div className="user-avatar" style={{ width: 44, height: 44, fontSize: 16, background: 'var(--primary)' }}>
                  {profile.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{profile.name}</div>
                  <div className="text-muted text-sm">{profile.email}</div>
                  {profile.is_blocked && <span className="badge badge-red">Blocked</span>}
                </div>
              </div>
              <div className="grid-2 text-sm" style={{ marginBottom: 14 }}>
                <div><span className="text-muted">Enrollment:</span> <strong className="font-mono">{profile.enrollment_no || '—'}</strong></div>
                <div><span className="text-muted">Course:</span> {profile.course || '—'}</div>
                <div><span className="text-muted">Semester:</span> {profile.semester || '—'}</div>
                <div><span className="text-muted">Mobile:</span> {profile.mobile || '—'}</div>
              </div>
              <hr className="divider" />
              <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Current Issues ({profile.currentIssues?.length || 0})</p>
              {profile.currentIssues?.length === 0
                ? <p className="text-muted text-sm">No active issues</p>
                : profile.currentIssues.map(i => (
                  <div key={i.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <strong>{i.title}</strong>
                    <span className="text-muted" style={{ marginLeft: 8 }}>Due: {new Date(i.due_date).toLocaleDateString()}</span>
                  </div>
                ))}
              <hr className="divider" />
              <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Fines</p>
              {profile.fines?.length === 0
                ? <p className="text-muted text-sm">No fines</p>
                : profile.fines.map(f => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                    <span>{f.book_title}</span>
                    <span>₹{parseFloat(f.amount).toFixed(2)} — <StatusBadge status={f.status} /></span>
                  </div>
                ))}
            </div>
          )}
        </Modal>
      )}
    </Layout>
  );
}

// ── Librarian Fines ───────────────────────────────────────────────────────────
export function LibrarianFines() {
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

  return (
    <Layout title="Fines">
      <div className="page-header">
        <div><h2 className="page-title">Fines</h2><p className="page-sub">Mark fines as paid (cash)</p></div>
      </div>
      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.msg}</Alert>}
      <div className="card">
        <div className="card-header">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ width: 130 }}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>
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
