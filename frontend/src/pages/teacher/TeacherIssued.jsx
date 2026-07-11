import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Empty } from '../../components/UI';
import api from '../../utils/api';

export default function TeacherIssued() {
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
              <thead><tr><th>Title</th><th>Copy Code</th><th>Author</th><th>Issue Date</th><th>Status</th></tr></thead>
              <tbody>
                {issued.length === 0 ? (
                  <tr><td colSpan={5}><Empty message="No books currently issued" /></td></tr>
                ) : issued.map(i => (
                  <tr key={i.id}>
                    <td>
                      <strong>{i.title}</strong>
                      <div className="text-muted text-sm">{i.category}</div>
                    </td>
                    <td className="font-mono text-sm"><strong>{i.copy_code || '—'}</strong></td>
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
