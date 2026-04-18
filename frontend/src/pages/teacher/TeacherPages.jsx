import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Pagination, Empty, Modal, Alert } from '../../components/UI';
import api from '../../utils/api';

// ── Teacher Dashboard ─────────────────────────────────────────────────────────
export function TeacherDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teacher/dashboard').then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><Spinner /></Layout>;

  return (
    <Layout title="My Dashboard">
      <div className="page-header">
        <div><h2 className="page-title">My Dashboard</h2></div>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-label">Books Issued</div>
          <div className="stat-value">{data?.issuedBooks || 0}</div>
          <div className="stat-sub">currently holding</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-body">
          <h3 style={{ marginBottom: '12px' }}>📚 Library Information for Teachers</h3>
          <ul style={{ lineHeight: '1.8', color: 'var(--text-muted)' }}>
            <li><strong>No time limit</strong> - Teachers can keep books as long as needed</li>
            <li><strong>No fines</strong> - There are no late fees for teachers</li>
            <li>Contact the librarian to return books when needed</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}

// ── Teacher Profile ───────────────────────────────────────────────────────────
export function TeacherProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  useEffect(() => {
    api.get('/teacher/profile').then(r => setProfile(r.data.data)).finally(() => setLoading(false));
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
                    ['Designation', profile.designation],
                    ['Mobile', profile.mobile],
                    ['Address', profile.address],
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

// ── Search Books ──────────────────────────────────────────────────────────────
export function TeacherBooks() {
  const [books, setBooks]     = useState([]);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [category, setCategory] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: 15 });
    if (search)   p.set('search', search);
    if (category) p.set('category', category);
    api.get(`/teacher/books?${p}`)
      .then(r => { setBooks(r.data.data); setMeta(r.data.meta); })
      .finally(() => setLoading(false));
  }, [page, search, category]);

  useEffect(() => { load(); }, [load]);

  return (
    <Layout title="Search Books">
      <div className="page-header">
        <div><h2 className="page-title">Search Books</h2><p className="page-sub">Find books in the library</p></div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="search-bar">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input placeholder="Search by title, author, ISBN…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <input placeholder="Category…" value={category} style={{ width: 130 }}
              onChange={e => { setCategory(e.target.value); setPage(1); }} />
          </div>
        </div>
        {loading ? <Spinner /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Title</th><th>Author</th><th>ISBN</th><th>Category</th><th>Location</th><th>Availability</th></tr></thead>
                <tbody>
                  {books.length === 0 ? (
                    <tr><td colSpan={6}><Empty icon="🔍" message="No books found" /></td></tr>
                  ) : books.map(b => (
                    <tr key={b.id}>
                      <td><strong>{b.title}</strong><div className="text-muted text-sm">{b.publisher || ''} {b.publication_year || ''}</div></td>
                      <td className="text-muted">{b.author}</td>
                      <td className="font-mono text-sm">{b.isbn || '—'}</td>
                      <td>{b.category ? <span className="badge badge-blue">{b.category}</span> : '—'}</td>
                      <td className="text-sm">{b.shelf_location || '—'}</td>
                      <td>
                        <span className={`badge ${b.available_copies > 0 ? 'badge-green' : 'badge-red'}`}>
                          {b.available_copies > 0 ? `${b.available_copies} Available` : 'Unavailable'}
                        </span>
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

// ── My Issued Books ───────────────────────────────────────────────────────────
export function TeacherIssued() {
  const [issued, setIssued]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teacher/issued').then(r => setIssued(r.data.data)).finally(() => setLoading(false));
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
              <thead><tr><th>Title</th><th>Author</th><th>Issue Date</th><th>Status</th></tr></thead>
              <tbody>
                {issued.length === 0 ? (
                  <tr><td colSpan={4}><Empty message="No books currently issued" /></td></tr>
                ) : issued.map(i => (
                  <tr key={i.id}>
                    <td>
                      <strong>{i.title}</strong>
                      <div className="text-muted text-sm">{i.category}</div>
                    </td>
                    <td className="text-muted">{i.author}</td>
                    <td className="text-sm">{new Date(i.issue_date).toLocaleDateString()}</td>
                    <td>
                      <span className="badge badge-green">Issued</span>
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

// ── History ───────────────────────────────────────────────────────────────────
export function TeacherHistory() {
  const [history, setHistory] = useState([]);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get(`/teacher/history?page=${page}&limit=15`)
      .then(r => { setHistory(r.data.data); setMeta(r.data.meta); })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <Layout title="History">
      <div className="page-header">
        <div><h2 className="page-title">Borrowing History</h2><p className="page-sub">All books you've ever borrowed</p></div>
      </div>
      <div className="card">
        {loading ? <Spinner /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Title</th><th>Author</th><th>Issue Date</th><th>Return Date</th><th>Status</th></tr></thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr><td colSpan={5}><Empty message="No history yet" /></td></tr>
                  ) : history.map(h => (
                    <tr key={h.id}>
                      <td><strong>{h.title}</strong></td>
                      <td className="text-muted">{h.author}</td>
                      <td className="text-sm">{new Date(h.issue_date).toLocaleDateString()}</td>
                      <td className="text-sm">{h.return_date ? new Date(h.return_date).toLocaleDateString() : '—'}</td>
                      <td>
                        {h.is_returned
                          ? <span className="badge badge-green">Returned</span>
                          : <span className="badge badge-blue">Issued</span>}
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
