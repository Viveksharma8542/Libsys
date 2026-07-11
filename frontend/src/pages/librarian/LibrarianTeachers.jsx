import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Modal, Pagination, Empty } from '../../components/UI';
import api from '../../utils/api';

export default function LibrarianTeachers() {
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
    } catch (_) { /* ignore */ }
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
