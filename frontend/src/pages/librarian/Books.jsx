import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Alert, Modal, Pagination, Empty, Confirm } from '../../components/UI';
import api from '../../utils/api';

const EMPTY_BOOK = {
  title: '', author: '', isbn: '', category: '', publisher: '',
  publication_year: '', total_copies: 1, shelf_location: '', description: '',
};

export default function LibrarianBooks() {
  const [books, setBooks]     = useState([]);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook]   = useState(null);
  const [form, setForm]       = useState(EMPTY_BOOK);
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving]   = useState(false);
  const [alert, setAlert]     = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: 15 });
    if (search)   p.set('search', search);
    if (category) p.set('category', category);
    api.get(`/librarian/books?${p}`)
      .then(r => { setBooks(r.data.data); setMeta(r.data.meta); })
      .finally(() => setLoading(false));
  }, [page, search, category]);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setEditBook(null); setForm(EMPTY_BOOK); setFormErr(''); setShowModal(true); };
  const openEdit = (b) => {
    setEditBook(b);
    setForm({ title: b.title, author: b.author, isbn: b.isbn || '', category: b.category || '',
      publisher: b.publisher || '', publication_year: b.publication_year || '',
      total_copies: b.total_copies, shelf_location: b.shelf_location || '', description: b.description || '' });
    setFormErr(''); setShowModal(true);
  };

  const handleSave = async () => {
    setFormErr('');
    if (!form.title || !form.author) { setFormErr('Title and author required'); return; }
    setSaving(true);
    try {
      // Build payload with proper types
      const payload = {
        title: form.title,
        author: form.author,
        isbn: form.isbn || null,
        category: form.category || null,
        publisher: form.publisher || null,
        publication_year: form.publication_year && form.publication_year !== '' ? Number(form.publication_year) : null,
        total_copies: form.total_copies ? Number(form.total_copies) : 1,
        shelf_location: form.shelf_location || null,
        description: form.description || null,
      };

      if (editBook) {
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const idStr = (editBook.id || '').toString().trim();
        if (!uuidRe.test(idStr)) {
          console.error('Invalid editBook.id:', editBook.id);
          setFormErr('Invalid book id — cannot save.');
          setSaving(false);
          return;
        }
        await api.put(`/librarian/books/${idStr}`, payload);
        setAlert({ type: 'success', msg: 'Book updated' });
      } else {
        await api.post('/librarian/books', payload);
        setAlert({ type: 'success', msg: 'Book added' });
      }
      setShowModal(false); load();
    } catch (e) {
      // Show detailed validation errors when available
      let msg = e.response?.data?.message || 'Save failed';
      if (e.response?.data?.errors && Array.isArray(e.response.data.errors) && e.response.data.errors.length) {
        const details = e.response.data.errors.map(err => `${err.param || err.field || err.path}: ${err.msg || err.message || err.message}`).join('; ');
        msg = `${msg} — ${details}`;
      }
      console.error('Save book error:', e.response || e.message);
      setFormErr(msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/librarian/books/${confirmDelete.id}`);
      setAlert({ type: 'success', msg: 'Book deleted' });
      setConfirmDelete(null); load();
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.message || 'Delete failed' });
      setConfirmDelete(null);
    } finally { setDeleting(false); }
  };

  return (
    <Layout title="Books">
      <div className="page-header">
        <div><h2 className="page-title">Book Inventory</h2><p className="page-sub">Manage all books</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Book</button>
      </div>

      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.msg}</Alert>}

      <div className="card">
        <div className="card-header">
          <div className="search-bar">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input placeholder="Title, author, ISBN…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <input placeholder="Category…" value={category} style={{ width: 140 }}
              onChange={e => { setCategory(e.target.value); setPage(1); }} />
          </div>
          <span className="text-muted text-sm">{meta?.total || 0} books</span>
        </div>

        {loading ? <Spinner /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th><th>Author</th><th>ISBN</th>
                    <th>Category</th><th>Year</th><th>Total</th><th>Available</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.length === 0 ? (
                    <tr><td colSpan={8}><Empty icon="📚" message="No books found" /></td></tr>
                  ) : books.map(b => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.title}</strong>
                        {b.shelf_location && <div className="text-muted text-sm">📍 {b.shelf_location}</div>}
                      </td>
                      <td className="text-muted">{b.author}</td>
                      <td className="font-mono text-sm">{b.isbn || '—'}</td>
                      <td>{b.category ? <span className="badge badge-blue">{b.category}</span> : '—'}</td>
                      <td className="font-mono">{b.publication_year || '—'}</td>
                      <td className="font-mono">{b.total_copies}</td>
                      <td>
                        <span className={`badge ${b.available_copies > 0 ? 'badge-green' : 'badge-red'}`}>
                          {b.available_copies}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm btn-outline" onClick={() => openEdit(b)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(b)}>Del</button>
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

      {showModal && (
        <Modal title={editBook ? 'Edit Book' : 'Add New Book'} onClose={() => setShowModal(false)}
          footer={<>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>}>
          {formErr && <Alert type="error">{formErr}</Alert>}
          <div className="form-row">
            <div className="form-group">
              <label>Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Author *</label>
              <input value={form.author} onChange={e => set('author', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>ISBN</label>
              <input value={form.isbn} onChange={e => set('isbn', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input value={form.category} onChange={e => set('category', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Publisher</label>
              <input value={form.publisher} onChange={e => set('publisher', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Year</label>
              <input type="number" value={form.publication_year} onChange={e => set('publication_year', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Total Copies *</label>
              <input type="number" min="1" value={form.total_copies} onChange={e => set('total_copies', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Shelf Location</label>
              <input value={form.shelf_location} onChange={e => set('shelf_location', e.target.value)} placeholder="e.g. CS-A1" />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} />
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Confirm
          message={`Delete "${confirmDelete.title}"? This cannot be undone.`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Layout>
  );
}
