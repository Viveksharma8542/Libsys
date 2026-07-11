import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Pagination, Empty } from '../../components/UI';
import api from '../../utils/api';

export default function StudentHistory() {
  const [history, setHistory] = useState([]);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get(`/student/history?page=${page}&limit=15`)
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
