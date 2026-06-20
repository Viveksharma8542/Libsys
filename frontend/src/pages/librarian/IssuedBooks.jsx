import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Alert, Pagination, Empty } from '../../components/UI';
import api from '../../utils/api';

export default function IssuedBooks() {
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
