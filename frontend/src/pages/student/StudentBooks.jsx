import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Pagination, Empty } from '../../components/UI';
import api from '../../utils/api';

export default function StudentBooks() {
  const [books, setBooks]     = useState([]);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [category, setCategory] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: 15 });
    if (search)   p.set('search', search);
    if (category) p.set('category', category);
    api.get(`/student/books?${p}`)
      .then(r => { setBooks(r.data.data); setMeta(r.data.meta); })
      .finally(() => setLoading(false));
  }, [page, search, category]);

  useEffect(() => { load(); }, [load]);

  return (
    <Layout title="Search Books">
      <div className="page-header">
        <div><h2 className="page-title">Search Books</h2><p className="page-sub">Find books in the library</p></div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="search-bar">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input placeholder="Search by title, author, ISBN…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <input placeholder="Category…" value={category} style={{ width: 130 }}
              onChange={e => { setCategory(e.target.value); setPage(1); }} />
          </div>
        </div>
        {loading ? <Spinner /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Title</th><th>Book Code</th><th>Author</th><th>ISBN</th><th>Category</th><th>Location</th><th>Availability</th></tr></thead>
                <tbody>
                  {books.length === 0 ? (
                    <tr><td colSpan={7}><Empty icon="🔍" message="No books found" /></td></tr>
                  ) : books.map(b => (
                    <tr key={b.id}>
                      <td><strong>{b.title}</strong><div className="text-muted text-sm">{b.publisher || ''} {b.publication_year || ''}</div></td>
                      <td className="font-mono text-sm"><strong>{b.book_code}</strong></td>
                      <td className="text-muted">{b.author}</td>
                      <td className="font-mono text-sm">{b.isbn || '—'}</td>
                      <td>{b.category ? <span className="badge badge-blue">{b.category}</span> : '—'}</td>
                      <td className="text-sm">{b.shelf_location || '—'}</td>
                      <td>
                        <span className={`badge ${b.available_copies > 0 ? 'badge-green' : 'badge-red'}`}>
                          {b.available_copies > 0 ? `${b.available_copies} Available` : 'Unavailable'}
                        </span>
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
