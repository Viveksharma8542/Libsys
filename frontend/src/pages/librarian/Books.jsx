import React, { useState, useEffect, useCallback, useRef } from 'react';
import { COURSE_GROUPS } from '../../utils/lists';
import Layout from '../../components/Layout';
import { Spinner, Alert, Modal, Pagination, Empty, Confirm } from '../../components/UI';
import api from '../../utils/api';
import * as XLSX from 'xlsx';

const EMPTY_BOOK = {
  title: '', author: '', isbn: '', book_code: '', category: '', course: '', publisher: '',
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
  const [dlOpen, setDlOpen] = useState(false);
  const dlRef = useRef(null);

  useEffect(() => {
    if (!dlOpen) return undefined;
    const close = (e) => { if (dlRef.current && !dlRef.current.contains(e.target)) setDlOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [dlOpen]);

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
    setForm({ title: b.title, author: b.author, isbn: b.isbn || '', book_code: b.book_code || '', category: b.category || '', course: b.course || '',
      publisher: b.publisher || '', publication_year: b.publication_year || '',
      total_copies: b.total_copies, shelf_location: b.shelf_location || '', description: b.description || '' });
    setFormErr(''); setShowModal(true);
  };

  const handleSave = async () => {
    setFormErr('');
    const required = ['title', 'author', 'isbn', 'book_code', 'category', 'publisher', 'publication_year', 'total_copies', 'shelf_location'];
    const missing = required.filter(k => !form[k]);
    if (missing.length) { setFormErr('All fields are required except description'); return; }
    setSaving(true);
    try {
      // Build payload with proper types
      const payload = {
        title: form.title,
        author: form.author,
        isbn: form.isbn || null,
        book_code: form.book_code,
        category: form.category || null,
        course: form.course || null,
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

  const downloadSheet = (rows, cols, sheetName, filename) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = cols;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  };

  const exportToExcel = async () => {
    try {
      const r = await api.get('/librarian/books?limit=10000');
      const all = r.data.data;
      const rows = all.map(b => ({
        Title: b.title,
        'Book Code': b.book_code,
        Author: b.author,
        ISBN: b.isbn || '',
        Category: b.category || '',
        Course: b.course || '',
        Publisher: b.publisher || '',
        Year: b.publication_year || '',
        'Total Copies': b.total_copies,
        'Available Copies': b.available_copies,
        'Shelf Location': b.shelf_location || '',
        Description: b.description || '',
      }));
      downloadSheet(rows,
        [{ wch: 40 }, { wch: 14 }, { wch: 25 }, { wch: 18 }, { wch: 15 },
         { wch: 20 }, { wch: 20 }, { wch: 8 }, { wch: 10 },
         { wch: 12 }, { wch: 14 }, { wch: 30 }],
        'Books', `books_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      setAlert({ type: 'error', msg: 'Export failed: ' + (e.response?.data?.message || e.message) });
    } finally { setDlOpen(false); }
  };

  const downloadMostIssued = async () => {
    try {
      const r = await api.get('/librarian/books/reports/most-issued?limit=50');
      const all = r.data.data || [];
      if (!all.length) { setAlert({ type: 'error', msg: 'No issue history yet' }); setDlOpen(false); return; }
      const rows = all.map((b, idx) => ({
        Rank: idx + 1,
        Title: b.title,
        'Book Code': b.book_code,
        Author: b.author,
        Category: b.category || '',
        Course: b.course || '',
        'Times Issued': b.times_issued,
        'Total Copies': b.total_copies,
        'Available Copies': b.available_copies,
      }));
      downloadSheet(rows,
        [{ wch: 6 }, { wch: 40 }, { wch: 14 }, { wch: 25 }, { wch: 15 },
         { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }],
        'Most Issued', `most_issued_books_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      setAlert({ type: 'error', msg: 'Export failed: ' + (e.response?.data?.message || e.message) });
    } finally { setDlOpen(false); }
  };

  const downloadNeverIssued = async () => {
    try {
      const r = await api.get('/librarian/books/reports/never-issued');
      const all = r.data.data || [];
      if (!all.length) { setAlert({ type: 'error', msg: 'Every book has been issued at least once 🎉' }); setDlOpen(false); return; }
      const rows = all.map(b => ({
        Title: b.title,
        'Book Code': b.book_code,
        Author: b.author,
        Category: b.category || '',
        Course: b.course || '',
        'Total Copies': b.total_copies,
        'Shelf Location': b.shelf_location || '',
      }));
      downloadSheet(rows,
        [{ wch: 40 }, { wch: 14 }, { wch: 25 }, { wch: 15 },
         { wch: 20 }, { wch: 12 }, { wch: 14 }],
        'Never Issued', `never_issued_books_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      setAlert({ type: 'error', msg: 'Export failed: ' + (e.response?.data?.message || e.message) });
    } finally { setDlOpen(false); }
  };

  return (
    <Layout title="Books">
      <div className="page-header">
        <div><h2 className="page-title">Book Inventory</h2><p className="page-sub">Manage all books</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="dropdown-wrap" ref={dlRef}>
            <button className="btn btn-outline" onClick={() => setDlOpen(o => !o)} aria-haspopup="menu" aria-expanded={dlOpen}>
              📥 Downloads ▾
            </button>
            {dlOpen && (
              <div className="dropdown-menu" role="menu">
                <button className="dropdown-item" onClick={exportToExcel} role="menuitem">
                  <span>📚</span> All books list
                </button>
                <button className="dropdown-item" onClick={downloadMostIssued} role="menuitem">
                  <span>🔥</span> Mostly issued books
                </button>
                <button className="dropdown-item" onClick={downloadNeverIssued} role="menuitem">
                  <span>💤</span> Never issued books
                </button>
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Book</button>
        </div>
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
                    <th>Title</th><th>Book Code</th><th>Author</th><th>ISBN</th>
                    <th>Category</th><th>Course</th><th>Year</th><th>Total</th><th>Available</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.length === 0 ? (
                    <tr><td colSpan={9}><Empty icon="📚" message="No books found" /></td></tr>
                  ) : books.map(b => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.title}</strong>
                        {b.shelf_location && <div className="text-muted text-sm">📍 {b.shelf_location}</div>}
                      </td>
                      <td className="font-mono text-sm"><strong>{b.book_code}</strong></td>
                      <td className="text-muted">{b.author}</td>
                      <td className="font-mono text-sm">{b.isbn || '—'}</td>
                      <td>{b.category ? <span className="badge badge-blue">{b.category}</span> : '—'}</td>
                      <td>{b.course ? <span className="badge badge-blue">{b.course}</span> : '—'}</td>
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
              <label>ISBN *</label>
              <input value={form.isbn} onChange={e => set('isbn', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Book Code *</label>
              <input value={form.book_code} onChange={e => set('book_code', e.target.value)} placeholder="e.g. CS-001" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <input value={form.category} onChange={e => set('category', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Course</label>
              <select value={form.course} onChange={e => set('course', e.target.value)}>
                <option value="">-- Select Course --</option>
                {COURSE_GROUPS.map(g => (
                  <optgroup key={g.group} label={g.group}>
                    {g.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Publisher *</label>
              <input value={form.publisher} onChange={e => set('publisher', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Year *</label>
              <input type="number" value={form.publication_year} onChange={e => set('publication_year', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Total Copies *</label>
              <input type="number" min="1" value={form.total_copies} onChange={e => set('total_copies', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Shelf Location *</label>
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
