import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Alert, Modal, Pagination, Empty, StatusBadge } from '../../components/UI';
import api from '../../utils/api';

export default function LibrarianStudents() {
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
