import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { Alert } from '../../components/UI';
import api from '../../utils/api';

export default function StudentRequest() {
  const [form, setForm]     = useState({ book_name: '', author: '', isbn: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert]   = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/student/request-book', form);
      setAlert({ type: 'success', msg: 'Book request submitted! Admin will review it.' });
      setForm({ book_name: '', author: '', isbn: '', reason: '' });
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.message || 'Failed to submit' });
    } finally { setLoading(false); }
  };

  return (
    <Layout title="Request Book">
      <div className="page-header">
        <div><h2 className="page-title">Request a Book</h2><p className="page-sub">Ask the library to acquire a book</p></div>
      </div>
      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.msg}</Alert>}
      <div className="card" style={{ maxWidth: 500 }}>
        <div className="card-header"><span className="card-title">Book Request Form</span></div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Book Name *</label>
              <input value={form.book_name} required onChange={e => set('book_name', e.target.value)} placeholder="Enter book title" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Author *</label>
                <input value={form.author} required onChange={e => set('author', e.target.value)} />
              </div>
              <div className="form-group">
                <label>ISBN *</label>
                <input value={form.isbn} required onChange={e => set('isbn', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Reason *</label>
              <textarea value={form.reason} required onChange={e => set('reason', e.target.value)} rows={3} placeholder="Why do you need this book?" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Submitting…' : '📩 Submit Request'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
