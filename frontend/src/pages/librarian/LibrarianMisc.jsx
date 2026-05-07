import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Alert, Modal, Pagination, Empty, StatusBadge } from '../../components/UI';
import api from '../../utils/api';

// ── Issue Book ────────────────────────────────────────────────────────────────
export function IssueBook() {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [books, setBooks]       = useState([]);
  const [form, setForm]         = useState({ borrower_type: 'student', student_id: '', teacher_id: '', book_id: '', due_days: '' });
  const [loading, setLoading]   = useState(false);
  const [loadData, setLoadData] = useState(true);
  const [alert, setAlert]       = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/librarian/students?limit=100'),
      api.get('/librarian/teachers?limit=100'),
      api.get('/librarian/books?limit=200'),
    ]).then(([s, t, b]) => {
      setStudents(s.data.data);
      setTeachers(t.data.data || []);
      setBooks(b.data.data.filter(bk => bk.available_copies > 0));
    }).finally(() => setLoadData(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleIssue = async (e) => {
    e.preventDefault();
    const { borrower_type, student_id, teacher_id, book_id, due_days } = form;
    
    if (!book_id) { setAlert({ type: 'error', msg: 'Select a book' }); return; }
    if (borrower_type === 'student' && !student_id) { setAlert({ type: 'error', msg: 'Select a student' }); return; }
    if (borrower_type === 'teacher' && !teacher_id) { setAlert({ type: 'error', msg: 'Select a teacher' }); return; }
    
    setLoading(true);
    try {
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const bookId = book_id?.toString().trim();
      if (!uuidRe.test(bookId)) { throw { response: { data: { message: 'Invalid book ID' } } }; }

      const payload = { book_id: bookId };
      if (borrower_type === 'student') {
        payload.student_id = student_id;
        if (due_days && due_days.toString().trim() !== '') payload.due_days = Number(due_days);
      } else {
        payload.teacher_id = teacher_id;
      }

      await api.post('/librarian/issue', payload);
      setAlert({ type: 'success', msg: borrower_type === 'teacher' ? 'Book issued to teacher (no time limit)!' : 'Book issued successfully!' });
      setForm({ borrower_type: 'student', student_id: '', teacher_id: '', book_id: '', due_days: '' });
      api.get('/librarian/books?limit=200').then(b => setBooks(b.data.data.filter(bk => bk.available_copies > 0)));
    } catch (e) {
      let msg = e.response?.data?.message || 'Issue failed';
      setAlert({ type: 'error', msg });
    } finally { setLoading(false); }
  };

  if (loadData) return <Layout title="Issue Book"><Spinner /></Layout>;

  return (
    <Layout title="Issue Book">
      <div className="page-header">
        <div><h2 className="page-title">Issue Book</h2><p className="page-sub">Issue a book to student or teacher</p></div>
      </div>
      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.msg}</Alert>}

      <div className="card" style={{ maxWidth: 540 }}>
        <div className="card-header"><span className="card-title">Issue Form</span></div>
        <div className="card-body">
          <form onSubmit={handleIssue}>
            <div className="form-group">
              <label>Borrower Type</label>
              <select value={form.borrower_type} onChange={e => set('borrower_type', e.target.value)}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            {form.borrower_type === 'student' ? (
              <div className="form-group">
                <label>Student *</label>
                <select value={form.student_id} onChange={e => set('student_id', e.target.value)}>
                  <option value="">— Select Student —</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id} disabled={s.is_blocked}>
                      {s.name} ({s.enrollment_no || s.email}){s.is_blocked ? ' [BLOCKED]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label>Teacher *</label>
                <select value={form.teacher_id} onChange={e => set('teacher_id', e.target.value)}>
                  <option value="">— Select Teacher —</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.employee_id || t.email})
                    </option>
                  ))}
                </select>
                <small className="text-muted">Teachers have no time limit and no fines</small>
              </div>
            )}

            <div className="form-group">
              <label>Book *</label>
              <select value={form.book_id} onChange={e => set('book_id', e.target.value)}>
                <option value="">— Select Book —</option>
                {books.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.title} — {b.author} (Avail: {b.available_copies})
                  </option>
                ))}
              </select>
            </div>

            {form.borrower_type === 'student' && (
              <div className="form-group">
                <label>Issue Duration (days) — leave blank for default</label>
                <input type="number" min="1" value={form.due_days}
                  onChange={e => set('due_days', e.target.value)} placeholder="Default from config" />
              </div>
            )}

            {form.borrower_type === 'teacher' && (
              <div className="form-group">
                <small style={{ color: 'var(--primary)' }}>Teachers can keep books indefinitely with no fines</small>
              </div>
            )}

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
                  <tr>
                    <th>Borrower</th>
                    <th>Book</th>
                    <th>Issue Date</th>
                    <th>{issued.some(i => i.borrower_type === 'teacher') ? 'Return Date' : 'Due Date'}</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issued.length === 0 ? (
                    <tr><td colSpan={6}><Empty message="No books currently issued" /></td></tr>
                  ) : issued.map(i => (
                    <tr key={i.id} className={i.is_overdue ? 'overdue-row' : ''}>
                      <td>
                        <div>{i.borrower_name}</div>
                        <div className="text-muted text-sm">{i.borrower_id}</div>
                      </td>
                      <td>
                        <div>{i.title}</div>
                        <div className="font-mono text-sm text-muted">{i.isbn}</div>
                      </td>
                      <td className="text-sm">{new Date(i.issue_date).toLocaleDateString()}</td>
                      <td className="text-sm">
                        {i.borrower_type === 'teacher' ? (
                          <span className="badge badge-blue">No due date</span>
                        ) : (
                          <>
                            {i.due_date ? new Date(i.due_date).toLocaleDateString() : '—'}
                            {i.is_overdue && <span className="badge badge-red" style={{ marginLeft: 4 }}>Overdue</span>}
                          </>
                        )}
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

// ── Librarian Teachers ────────────────────────────────────────────────────────
export function LibrarianTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [meta, setMeta]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [profile, setProfile]   = useState(null);
  const [profLoading, setProfLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: 15 });
    if (search) p.set('search', search);
    api.get(`/librarian/teachers?${p}`)
      .then(r => { setTeachers(r.data.data); setMeta(r.data.meta); })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const viewProfile = async (id) => {
    setProfLoading(true);
    try {
      const r = await api.get(`/librarian/teachers/${id}`);
      setProfile(r.data.data);
    } catch (e) { } 
    finally { setProfLoading(false); }
  };

  return (
    <Layout title="Teachers">
      <div className="page-header">
        <div><h2 className="page-title">Teachers</h2><p className="page-sub">View which teachers have issued books</p></div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input placeholder="Name, email, employee ID…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>
        {loading ? <Spinner /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Employee ID</th><th>Department</th><th>Issued Books</th><th>Actions</th></tr></thead>
                <tbody>
                  {teachers.length === 0 ? (
                    <tr><td colSpan={5}><Empty message="No teachers" /></td></tr>
                  ) : teachers.map(t => (
                    <tr key={t.id}>
                      <td><div>{t.name}</div><div className="text-muted text-sm">{t.email}</div></td>
                      <td className="font-mono text-sm">{t.employee_id || '—'}</td>
                      <td className="text-sm">{t.department || '—'}</td>
                      <td className="font-mono">{t.active_issues || 0}</td>
                      <td><button className="btn btn-sm btn-outline" onClick={() => viewProfile(t.id)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={meta} onPage={setPage} />
          </>
        )}
      </div>
      {(profile || profLoading) && (
        <Modal title="Teacher Profile" onClose={() => setProfile(null)}
          footer={<button className="btn btn-outline" onClick={() => setProfile(null)}>Close</button>}>
          {profLoading ? <Spinner /> : profile && (
            <div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <div className="user-avatar" style={{ width: 44, height: 44, fontSize: 16, background: 'var(--primary)' }}>
                  {profile.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div><div style={{ fontWeight: 600 }}>{profile.name}</div><div className="text-muted text-sm">{profile.email}</div></div>
              </div>
              <table style={{ fontSize: 13 }}>
                {[['Employee ID', profile.employee_id], ['Department', profile.department], ['Designation', profile.designation], ['Mobile', profile.mobile]].map(([k, v]) => v ? (
                  <tr key={k}><td style={{ padding: '4px 0', color: 'var(--text-muted)' }}>{k}</td><td style={{ padding: '4px 0' }}>{v}</td></tr>
                ) : null)}
              </table>
              <hr className="divider" />
              <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Currently Issued Books</p>
              {profile.currentIssues?.length === 0 ? <p className="text-muted text-sm">No books issued</p> : profile.currentIssues?.map(i => (
                <div key={i.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <div style={{ fontWeight: 500 }}>{i.title}</div>
                  <div className="text-muted text-sm">{i.author} — Issued: {new Date(i.issue_date).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </Layout>
  );
}

// ── Librarian Profile ───────────────────────────────────────────────────────────
export function LibrarianProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  useEffect(() => {
    api.get('/librarian/profile').then(r => setProfile(r.data.data)).finally(() => setLoading(false));
  }, []);

  const handlePasswordChange = async () => {
    setPwdError('');
    if (pwdForm.newPassword !== pwdForm.confirm) { setPwdError('Passwords do not match'); return; }
    if (pwdForm.newPassword.length < 8) { setPwdError('Password must be at least 8 characters'); return; }
    setPwdLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      setPwdSuccess(true);
      setPwdForm({ currentPassword: '', newPassword: '', confirm: '' });
      setTimeout(() => { setShowPasswordModal(false); setPwdSuccess(false); }, 1500);
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to change password');
    } finally { setPwdLoading(false); }
  };

  if (loading) return <Layout title="Profile"><Spinner /></Layout>;

  return (
    <Layout title="My Profile">
      <div className="page-header">
        <div><h2 className="page-title">My Profile</h2></div>
        <button className="btn btn-outline" onClick={() => setShowPasswordModal(true)}>🔑 Reset Password</button>
      </div>
      {profile && (
        <div style={{ maxWidth: 500 }}>
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 }}>
                <div className="user-avatar" style={{ width: 48, height: 48, fontSize: 18, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                  {profile.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{profile.name}</div>
                  <div className="text-muted text-sm">{profile.email}</div>
                </div>
              </div>
              <table style={{ fontSize: 13 }}>
                <tbody>
                  {[
                    ['Employee ID', profile.employee_id],
                    ['Department', profile.department],
                    ['Mobile', profile.mobile],
                  ].map(([k, v]) => v ? (
                    <tr key={k}>
                      <td style={{ padding: '5px 0', color: 'var(--text-muted)', width: 140 }}>{k}</td>
                      <td style={{ padding: '5px 0', fontWeight: 500 }}>{v}</td>
                    </tr>
                  ) : null)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <Modal title="Reset Password" onClose={() => setShowPasswordModal(false)}
          footer={<>
            <button className="btn btn-outline" onClick={() => setShowPasswordModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handlePasswordChange} disabled={pwdLoading}>
              {pwdLoading ? 'Updating...' : 'Update Password'}
            </button>
          </>}>
          {pwdError && <Alert type="error">{pwdError}</Alert>}
          {pwdSuccess && <Alert type="success">Password changed successfully!</Alert>}
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" value={pwdForm.currentPassword} onChange={e => setPwdForm(f => ({...f, currentPassword: e.target.value}))} />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={pwdForm.newPassword} onChange={e => setPwdForm(f => ({...f, newPassword: e.target.value}))} placeholder="Min 8 characters" />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" value={pwdForm.confirm} onChange={e => setPwdForm(f => ({...f, confirm: e.target.value}))} />
          </div>
        </Modal>
      )}
    </Layout>
  );
}
