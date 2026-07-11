import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Layout from '../../components/Layout';
import { Spinner, Alert, Pagination, Empty, StatusBadge } from '../../components/UI';
import api from '../../utils/api';

export default function AdminBookRequests() {
  const [requests, setRequests] = useState([]);
  const [meta, setMeta]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  const [alert, setAlert]       = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/book-requests?page=${page}&limit=20`)
      .then(r => { setRequests(r.data.data); setMeta(r.data.meta); })
      .finally(() => setLoading(false));
  }, [page]);

  const acceptRequest = async (id) => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/book-requests/${id}/accept`);
      setAlert({ type: 'success', msg: 'Request accepted' });
      setLoading(true);
      const r = await api.get(`/admin/book-requests?page=${page}&limit=20`);
      setRequests(r.data.data); setMeta(r.data.meta);
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.message || 'Failed to accept' });
    } finally { setActionLoading(null); setLoading(false); }
  };

  const rejectRequest = async (id) => {
    if (!window.confirm('Reject this book request?')) return;
    setActionLoading(id);
    try {
      await api.patch(`/admin/book-requests/${id}/reject`, { reason: 'Rejected by admin' });
      setAlert({ type: 'success', msg: 'Request rejected' });
      setLoading(true);
      const r = await api.get(`/admin/book-requests?page=${page}&limit=20`);
      setRequests(r.data.data); setMeta(r.data.meta);
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.message || 'Failed to reject' });
    } finally { setActionLoading(null); setLoading(false); }
  };

  const downloadExcel = async (status, label) => {
    try {
      const r = await api.get('/admin/book-requests?limit=10000');
      const all = r.data.data;
      const filtered = all.filter(req => req.status === status);
      if (filtered.length === 0) {
        setAlert({ type: 'error', msg: `No ${label} requests to export` });
        return;
      }
      const rows = filtered.map(r => ({
        'Student Name': r.student_name,
        'Enrollment No': r.enrollment_no || '',
        'Email': r.student_email || '',
        'Book Name': r.book_name,
        'Author': r.author || '',
        'ISBN': r.isbn || '',
        'Reason': r.reason || '',
        'Admin Notes': r.admin_notes || '',
        'Status': r.status,
        'Requested Date': new Date(r.created_at).toLocaleDateString(),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 25 }, { wch: 18 }, { wch: 28 }, { wch: 35 },
        { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 30 },
        { wch: 12 }, { wch: 14 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${label} Requests`);
      XLSX.writeFile(wb, `${label.toLowerCase()}_book_requests_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      setAlert({ type: 'error', msg: 'Export failed: ' + (e.response?.data?.message || e.message) });
    }
  };

  return (
    <Layout title="Book Requests">
      <div className="page-header">
        <div><h2 className="page-title">Book Requests</h2><p className="page-sub">Student demand list</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => downloadExcel('approved', 'Approved')}>📥 Approved List</button>
          <button className="btn btn-outline" onClick={() => downloadExcel('rejected', 'Rejected')}>📥 Rejected List</button>
        </div>
      </div>
      <div className="card">
        {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.msg}</Alert>}
        {loading ? <Spinner /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student</th><th>Book Name</th><th>Author</th><th>Reason</th><th>Status</th><th>Action</th><th>Date</th></tr></thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr><td colSpan={7}><Empty message="No requests" /></td></tr>
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
                      <td>
                        {r.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-sm btn-primary" onClick={() => acceptRequest(r.id)} disabled={actionLoading === r.id}>
                              {actionLoading === r.id ? 'Accepting…' : 'Accept'}
                            </button>
                            <button className="btn btn-sm btn-outline btn-danger" onClick={() => rejectRequest(r.id)} disabled={actionLoading === r.id}>
                              {actionLoading === r.id ? 'Processing…' : 'Reject'}
                            </button>
                          </div>
                        ) : '—'}
                      </td>
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
