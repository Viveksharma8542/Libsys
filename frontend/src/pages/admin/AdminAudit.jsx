import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Pagination, Empty } from '../../components/UI';
import api from '../../utils/api';

export default function AdminAudit() {
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
