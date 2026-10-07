import React, { useState, useEffect, useCallback } from 'react';
import { COURSES } from '../../utils/lists';
import Layout from '../../components/Layout';
import { Spinner, Alert, Empty, StatusBadge } from '../../components/UI';
import api from '../../utils/api';

export default function Holds() {
  const [holds, setHolds]       = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [books, setBooks]       = useState([]);
  const [form, setForm]         = useState({ borrower_type: 'student', student_id: '', teacher_id: '', book_id: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading]   = useState(true);
  const [loadData, setLoadData] = useState(true);
  const [saving, setSaving]     = useState(false);
  const [alert, setAlert]       = useState(null);
  const [course, setCourse] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Same fixed list as registration & books — identical options on every page
  const courses = COURSES;

  const matchCourse = (d) => !course || (d && d.toLowerCase() === course.toLowerCase());
  const filteredStudents = students.filter(s => matchCourse(s.course));
  const filteredTeachers = teachers.filter(t => matchCourse(t.course));
  // Holds are only valid on fully-issued books (zero free copies)
  const filteredBooks = books.filter(b => parseInt(b.available_copies) === 0 && matchCourse(b.course));

  const handleCourseChange = (d) => {
    setCourse(d);
    setForm(f => ({ ...f, student_id: '', teacher_id: '', book_id: '' }));
  };

  // Picking a member auto-syncs the course filter to theirs
  const handleStudentChange = (id) => {
    const st = students.find(s => s.id === id);
    setForm(f => ({ ...f, student_id: id }));
    if (st?.course) setCourse(st.course);
  };

  const handleTeacherChange = (id) => {
    const tc = teachers.find(t => t.id === id);
    setForm(f => ({ ...f, teacher_id: id }));
    if (tc?.course) setCourse(tc.course);
  };

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/librarian/holds?status=${statusFilter}`)
      .then(r => setHolds(r.data.data || []))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    Promise.all([
      api.get('/librarian/students?limit=100'),
      api.get('/librarian/teachers?limit=100'),
      api.get('/librarian/books?limit=200'),
    ]).then(([s, t, b]) => {
      setStudents(s.data.data || []);
      setTeachers(t.data.data || []);
      setBooks(b.data.data || []);
    }).finally(() => setLoadData(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    const { borrower_type, student_id, teacher_id, book_id } = form;
    if (!book_id) { setAlert({ type: 'error', msg: 'Select a book' }); return; }
    if (borrower_type === 'student' && !student_id) { setAlert({ type: 'error', msg: 'Select a student' }); return; }
    if (borrower_type === 'teacher' && !teacher_id) { setAlert({ type: 'error', msg: 'Select a teacher' }); return; }
    setSaving(true);
    try {
      const payload = { book_id };
      if (borrower_type === 'student') payload.student_id = student_id;
      else payload.teacher_id = teacher_id;
      await api.post('/librarian/holds', payload);
      const member = borrower_type === 'student'
        ? students.find(s => s.id === student_id)?.name
        : teachers.find(t => t.id === teacher_id)?.name;
      setAlert({ type: 'success', msg: `Hold placed — ${member} will be emailed when a copy returns.` });
      setForm({ borrower_type: 'student', student_id: '', teacher_id: '', book_id: '' });
      load();
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.message || 'Could not place hold' });
    } finally { setSaving(false); }
  };

  const handleCancel = async (id) => {
    try {
      await api.patch(`/librarian/holds/${id}/cancel`);
      setAlert({ type: 'success', msg: 'Hold cancelled' });
      load();
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.message || 'Cancel failed' });
    }
  };

  if (loadData) return <Layout title="Holds"><Spinner /></Layout>;

  return (
    <Layout title="Holds">
      <div className="page-header">
        <div><h2 className="page-title">Hold Requests</h2><p className="page-sub">Waitlist for fully-issued books — email goes out on return</p></div>
      </div>
      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.msg}</Alert>}

      <div className="card" style={{ maxWidth: 540, marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Place a Hold</span></div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Course</label>
              <select value={course} onChange={e => handleCourseChange(e.target.value)}>
                <option value="">— All Courses —</option>
                {courses.map(d => <option key={d} value={d}>{d}</option>)}
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
                    <option key={s.id} value={s.id}>{s.name} ({s.enrollment_no || s.email})</option>
                  ))}
                </select>
                {course && <small className="text-muted">Showing {course} students</small>}
              </div>
            ) : (
              <div className="form-group">
                <label>Teacher *</label>
                <select value={form.teacher_id} onChange={e => handleTeacherChange(e.target.value)}>
                  <option value="">— Select Teacher —</option>
                  {filteredTeachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.employee_id || t.email})</option>
                  ))}
                </select>
                {course && <small className="text-muted">Showing {course} teachers</small>}
              </div>
            )}
            <div className="form-group">
              <label>Book *</label>
              <select value={form.book_id} onChange={e => set('book_id', e.target.value)}>
                <option value="">— Select Book —</option>
                {filteredBooks.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.title} — {b.author} (All issued ⏳)
                  </option>
                ))}
              </select>
              {filteredBooks.length === 0
                ? <small className="text-muted">
                    {course
                      ? `No fully-issued books in ${course} — nothing to hold right now.`
                      : 'No fully-issued books right now — holds are only for books with zero free copies.'}
                  </small>
                : <small className="text-muted">
                    {course ? `Showing fully-issued ${course} books` : 'Showing fully-issued books only'} ({filteredBooks.length})
                  </small>}
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Placing…' : '📌 Place Hold'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Waitlist</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 140 }}>
            <option value="all">All</option>
            <option value="waiting">Waiting</option>
            <option value="notified">Notified</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        {loading ? <Spinner /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Borrower</th><th>Book</th><th>Requested</th><th>Status</th><th>Email</th><th>Action</th></tr></thead>
              <tbody>
                {holds.length === 0 ? (
                  <tr><td colSpan={6}><Empty message="No hold requests" /></td></tr>
                ) : holds.map(h => (
                  <tr key={h.id}>
                    <td>
                      <div>{h.borrower_name}</div>
                      <div className="text-muted text-sm">
                        {h.borrower_type === 'student' ? h.enrollment_no : h.employee_id} · {h.borrower_type}
                      </div>
                    </td>
                    <td>
                      <div>{h.book_title}</div>
                      <div className="font-mono text-sm text-muted">{h.book_code}</div>
                    </td>
                    <td className="text-sm">{new Date(h.created_at).toLocaleDateString()}</td>
                    <td>
                      <StatusBadge status={h.status} />
                      {h.status === 'notified' && h.expires_at && (
                        <div className="text-muted text-sm" style={{ marginTop: 2 }}>
                          ⏳ Expires {new Date(h.expires_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="text-sm">
                      {h.status === 'notified' ? (h.email_sent ? '✅ Sent' : '⚠️ Failed — inform manually') : '—'}
                    </td>
                    <td>
                      {(h.status === 'waiting' || h.status === 'notified') && (
                        <button className="btn btn-sm btn-outline" onClick={() => handleCancel(h.id)}>Cancel</button>
                      )}
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
