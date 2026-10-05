import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Alert } from '../../components/UI';
import api from '../../utils/api';

export default function IssueBook() {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [copies, setCopies]     = useState([]);
  const [form, setForm]         = useState({ borrower_type: 'student', student_id: '', teacher_id: '', book_id: '', copy_id: '' });
  const [loading, setLoading]   = useState(false);
  const [loadData, setLoadData] = useState(true);
  const [copiesLoading, setCopiesLoading] = useState(false);
  const [alert, setAlert]       = useState(null);
  const [department, setDepartment] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/librarian/students?limit=100'),
      api.get('/librarian/teachers?limit=100'),
      api.get('/librarian/books?limit=200'),
    ]).then(([s, t, b]) => {
      setStudents(s.data.data);
      setTeachers(t.data.data || []);
      setAllBooks(b.data.data.filter(bk => bk.available_copies > 0));
    }).finally(() => setLoadData(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // All departments present in students / teachers / books
  const departments = useMemo(() => [...new Set([
    ...students.map(s => s.department),
    ...teachers.map(t => t.department),
    ...allBooks.map(b => b.department),
  ].filter(Boolean))].sort(), [students, teachers, allBooks]);

  const matchDept = (d) => !department || (d && d.toLowerCase() === department.toLowerCase());
  const filteredStudents = students.filter(s => matchDept(s.department));
  const filteredTeachers = teachers.filter(t => matchDept(t.department));
  const filteredBooks = allBooks.filter(b => matchDept(b.department));

  const resetSelections = () => {
    setForm(f => ({ ...f, student_id: '', teacher_id: '', book_id: '', copy_id: '' }));
    setCopies([]);
  };

  const handleDepartmentChange = (d) => {
    setDepartment(d);
    resetSelections();
  };

  // Picking a member auto-syncs the department filter to theirs
  const handleStudentChange = (id) => {
    const st = students.find(s => s.id === id);
    setForm(f => ({ ...f, student_id: id, book_id: '', copy_id: '' }));
    setCopies([]);
    if (st?.department) setDepartment(st.department);
  };

  const handleTeacherChange = (id) => {
    const tc = teachers.find(t => t.id === id);
    setForm(f => ({ ...f, teacher_id: id, book_id: '', copy_id: '' }));
    setCopies([]);
    if (tc?.department) setDepartment(tc.department);
  };

  // When book is selected, fetch available copies
  const handleBookChange = (bookId) => {
    set('book_id', bookId);
    set('copy_id', '');
    setCopies([]);
    if (!bookId) return;
    setCopiesLoading(true);
    api.get(`/librarian/books/${bookId}/copies?status=available`)
      .then(r => setCopies(r.data.data || []))
      .finally(() => setCopiesLoading(false));
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    const { borrower_type, student_id, teacher_id, book_id, copy_id } = form;

    if (!book_id) { setAlert({ type: 'error', msg: 'Select a book' }); return; }
    if (!copy_id) { setAlert({ type: 'error', msg: 'Select a specific book copy' }); return; }
    if (borrower_type === 'student' && !student_id) { setAlert({ type: 'error', msg: 'Select a student' }); return; }
    if (borrower_type === 'teacher' && !teacher_id) { setAlert({ type: 'error', msg: 'Select a teacher' }); return; }

    setLoading(true);
    try {
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const bookId = book_id?.toString().trim();
      const copyId = copy_id?.toString().trim();
      if (!uuidRe.test(bookId)) { const err = new Error('Invalid book ID'); err.response = { data: { message: 'Invalid book ID' } }; throw err; }
      if (!uuidRe.test(copyId)) { const err = new Error('Invalid copy ID'); err.response = { data: { message: 'Invalid copy ID' } }; throw err; }

      const payload = { book_id: bookId, copy_id: copyId };
      if (borrower_type === 'student') {
        payload.student_id = student_id;
      } else {
        payload.teacher_id = teacher_id;
      }

      await api.post('/librarian/issue', payload);
      const selectedCopy = copies.find(c => c.id === copyId);
      setAlert({ type: 'success', msg: `Book issued! Copy: ${selectedCopy?.copy_code || copyId}` });
      setForm(f => ({ ...f, student_id: '', teacher_id: '', book_id: '', copy_id: '' }));
      setCopies([]);
      api.get('/librarian/books?limit=200').then(b => setAllBooks(b.data.data.filter(bk => bk.available_copies > 0)));
    } catch (e) {
      let msg = e.response?.data?.message || 'Issue failed';
      setAlert({ type: 'error', msg });
    } finally { setLoading(false); }
  };

  if (loadData) return <Layout title="Issue Book"><Spinner /></Layout>;

  return (
    <Layout title="Issue Book">
      <div className="page-header">
        <div><h2 className="page-title">Issue Book</h2><p className="page-sub">Issue a specific book copy to student or teacher</p></div>
      </div>
      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.msg}</Alert>}

      <div className="card" style={{ maxWidth: 540 }}>
        <div className="card-header"><span className="card-title">Issue Form</span></div>
        <div className="card-body">
          <form onSubmit={handleIssue}>
            <div className="form-group">
              <label>Department</label>
              <select value={department} onChange={e => handleDepartmentChange(e.target.value)}>
                <option value="">— All Departments —</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

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
                <select value={form.student_id} onChange={e => handleStudentChange(e.target.value)}>
                  <option value="">— Select Student —</option>
                  {filteredStudents.map(s => (
                    <option key={s.id} value={s.id} disabled={s.is_blocked}>
                      {s.name} ({s.enrollment_no || s.email}){s.is_blocked ? ' [BLOCKED]' : ''}
                    </option>
                  ))}
                </select>
                {department && <small className="text-muted">Showing {department} students</small>}
              </div>
            ) : (
              <div className="form-group">
                <label>Teacher *</label>
                <select value={form.teacher_id} onChange={e => handleTeacherChange(e.target.value)}>
                  <option value="">— Select Teacher —</option>
                  {filteredTeachers.map(t => (
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
              <select value={form.book_id} onChange={e => handleBookChange(e.target.value)}>
                <option value="">— Select Book —</option>
                {filteredBooks.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.title} — {b.author} (Avail: {b.available_copies})
                  </option>
                ))}
              </select>
              {department
                ? <small className="text-muted">Showing {department} books ({filteredBooks.length})</small>
                : <small className="text-muted">{filteredBooks.length} books available</small>}
            </div>

            {form.book_id && (
              <div className="form-group">
                <label>Select Copy *</label>
                {copiesLoading ? (
                  <div style={{ padding: '8px 0', fontSize: 13, color: 'var(--text-muted)' }}>Loading copies...</div>
                ) : (
                  <select value={form.copy_id} onChange={e => set('copy_id', e.target.value)}>
                    <option value="">— Select Specific Copy —</option>
                    {copies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.copy_code}
                      </option>
                    ))}
                  </select>
                )}
                {copies.length === 0 && !copiesLoading && form.book_id && (
                  <small className="text-muted">No available copies</small>
                )}
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
