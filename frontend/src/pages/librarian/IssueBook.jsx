import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Alert } from '../../components/UI';
import api from '../../utils/api';

export default function IssueBook() {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [books, setBooks]       = useState([]);
  const [form, setForm]         = useState({ borrower_type: 'student', student_id: '', teacher_id: '', book_id: '', due_days: '' });
  const [loading, setLoading]   = useState(false);
  const [loadData, setLoadData] = useState(true);
  const [alert, setAlert]       = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/librarian/students?limit=100'),
      api.get('/librarian/teachers?limit=100'),
      api.get('/librarian/books?limit=200'),
    ]).then(([s, t, b]) => {
      setStudents(s.data.data);
      setTeachers(t.data.data || []);
      setBooks(b.data.data.filter(bk => bk.available_copies > 0));
    }).finally(() => setLoadData(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleIssue = async (e) => {
    e.preventDefault();
    const { borrower_type, student_id, teacher_id, book_id, due_days } = form;

    if (!book_id) { setAlert({ type: 'error', msg: 'Select a book' }); return; }
    if (borrower_type === 'student' && !student_id) { setAlert({ type: 'error', msg: 'Select a student' }); return; }
    if (borrower_type === 'teacher' && !teacher_id) { setAlert({ type: 'error', msg: 'Select a teacher' }); return; }

    setLoading(true);
    try {
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const bookId = book_id?.toString().trim();
      if (!uuidRe.test(bookId)) { const err = new Error('Invalid book ID'); err.response = { data: { message: 'Invalid book ID' } }; throw err; }

      const payload = { book_id: bookId };
      if (borrower_type === 'student') {
        payload.student_id = student_id;
        if (due_days && due_days.toString().trim() !== '') payload.due_days = Number(due_days);
      } else {
        payload.teacher_id = teacher_id;
      }

      await api.post('/librarian/issue', payload);
      setAlert({ type: 'success', msg: borrower_type === 'teacher' ? 'Book issued to teacher (no time limit)!' : 'Book issued successfully!' });
      setForm({ borrower_type: 'student', student_id: '', teacher_id: '', book_id: '', due_days: '' });
      api.get('/librarian/books?limit=200').then(b => setBooks(b.data.data.filter(bk => bk.available_copies > 0)));
    } catch (e) {
      let msg = e.response?.data?.message || 'Issue failed';
      setAlert({ type: 'error', msg });
    } finally { setLoading(false); }
  };

  if (loadData) return <Layout title="Issue Book"><Spinner /></Layout>;

  return (
    <Layout title="Issue Book">
      <div className="page-header">
        <div><h2 className="page-title">Issue Book</h2><p className="page-sub">Issue a book to student or teacher</p></div>
      </div>
      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.msg}</Alert>}

      <div className="card" style={{ maxWidth: 540 }}>
        <div className="card-header"><span className="card-title">Issue Form</span></div>
        <div className="card-body">
          <form onSubmit={handleIssue}>
            <div className="form-group">
              <label>Borrower Type</label>
              <select value={form.borrower_type} onChange={e => set('borrower_type', e.target.value)}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            {form.borrower_type === 'student' ? (
              <div className="form-group">
                <label>Student *</label>
                <select value={form.student_id} onChange={e => set('student_id', e.target.value)}>
                  <option value="">— Select Student —</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id} disabled={s.is_blocked}>
                      {s.name} ({s.enrollment_no || s.email}){s.is_blocked ? ' [BLOCKED]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label>Teacher *</label>
                <select value={form.teacher_id} onChange={e => set('teacher_id', e.target.value)}>
                  <option value="">— Select Teacher —</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.employee_id || t.email})
                    </option>
                  ))}
                </select>
                <small className="text-muted">Teachers have no time limit and no fines</small>
              </div>
            )}

            <div className="form-group">
              <label>Book *</label>
              <select value={form.book_id} onChange={e => set('book_id', e.target.value)}>
                <option value="">— Select Book —</option>
                {books.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.title} — {b.author} (Avail: {b.available_copies})
                  </option>
                ))}
              </select>
            </div>

            {form.borrower_type === 'student' && (
              <div className="form-group">
                <label>Issue Duration (days) — leave blank for default</label>
                <input type="number" min="1" value={form.due_days}
                  onChange={e => set('due_days', e.target.value)} placeholder="Default from config" />
              </div>
            )}

            {form.borrower_type === 'teacher' && (
              <div className="form-group">
                <small style={{ color: 'var(--primary)' }}>Teachers can keep books indefinitely with no fines</small>
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <><div className="spinner" /> Issuing…</> : '📤 Issue Book'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
