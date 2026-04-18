import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Alert, Modal, Pagination, Empty } from '../../components/UI';
import api from '../../utils/api';

const EMPTY_FORM = {
  name: '', email: '', role: 'student', password: 'Password@123',
  course: '', semester: '', year: '', mobile: '', address: '', enrollment_no: '',
  employee_id: '', department: '', designation: '',
};

const CSV_TEMPLATE_STUDENT = `name,email,role,password,course,semester,year,mobile,address,enrollment_no
John Doe,john@example.com,student,Password@123,B.Tech CS,5th,3,9876543210,123 Main St,ENR001
Jane Smith,jane@example.com,student,Password@123,B.Sc Math,3rd,2,9876543211,456 Oak Ave,ENR002`;

const CSV_TEMPLATE_TEACHER = `name,email,role,password,employee_id,department,designation,mobile,address
John Doe,john@example.com,teacher,Password@123,EMP001,Computer Science,Professor,9876543210,123 Main St
Jane Smith,jane@example.com,teacher,Password@123,EMP002,Mathematics,Lecturer,9876543211,456 Oak Ave`;

const CSV_TEMPLATE_LIBRARIAN = `name,email,role,password,employee_id,department
Alice Brown,alice@example.com,librarian,Password@123,EMP002,Digital Services
Bob Wilson,bob@example.com,librarian,Password@123,EMP003,Reference Section`;

export default function AdminUsers() {
  const [users, setUsers]       = useState([]);
  const [meta, setMeta]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal]    = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [formErr, setFormErr]   = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving]     = useState(false);
  const [alert, setAlert]       = useState(null);
  const [bulkResults, setBulkResults] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const fileInputRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15 });
    if (search)     params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    api.get(`/admin/users?${params}`)
      .then(r => { setUsers(r.data.data); setMeta(r.data.meta); })
      .finally(() => setLoading(false));
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateField = (name, value, setErr = true) => {
    let errorMsg = '';
    
    if (name === 'email' && value.trim() && !validateEmail(value.trim())) {
      errorMsg = 'Invalid email format (e.g., user@domain.com)';
    } else if (name === 'password' && value && value.trim().length < 8) {
      errorMsg = 'Minimum 8 characters required';
    }
    
    if (setErr) {
      const errors = { ...fieldErrors };
      if (errorMsg) {
        errors[name] = errorMsg;
      } else {
        delete errors[name];
      }
      setFieldErrors(errors);
    }
    return errorMsg;
  };

  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    if (!value.trim()) {
      if (!fieldErrors[name]) {
        const errors = { ...fieldErrors };
        errors[name] = 'This field is required';
        setFieldErrors(errors);
      }
    } else {
      validateField(name, value);
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    set(name, value);
    if (fieldErrors[name]) {
      const errors = { ...fieldErrors };
      delete errors[name];
      setFieldErrors(errors);
    }
  };

  const handleSave = async () => {
    setFormErr('');
    setFieldErrors({});
    const errors = {};
    if (!form.name.trim()) { errors.name = 'Name is required'; }
    if (!form.email.trim()) { errors.email = 'Email is required'; }
    else if (!validateEmail(form.email.trim())) { errors.email = 'Please enter a valid email format (e.g., user@domain.com)'; }
    if (!form.password || form.password.trim().length < 8) { errors.password = 'Password must be at least 8 characters'; }
    
    if (form.role === 'student') {
      if (!form.enrollment_no?.trim()) { errors.enrollment_no = 'Enrollment No is required'; }
      if (!form.course?.trim()) { errors.course = 'Course is required'; }
      if (!form.semester?.trim()) { errors.semester = 'Semester is required'; }
      if (!form.year?.trim()) { errors.year = 'Year is required'; }
      if (!form.mobile?.trim()) { errors.mobile = 'Mobile is required'; }
      if (!form.address?.trim()) { errors.address = 'Address is required'; }
    } else if (form.role === 'teacher') {
      if (!form.employee_id?.trim()) { errors.employee_id = 'Employee ID is required'; }
      if (!form.department?.trim()) { errors.department = 'Department is required'; }
      if (!form.designation?.trim()) { errors.designation = 'Designation is required'; }
      if (!form.mobile?.trim()) { errors.mobile = 'Mobile is required'; }
      if (!form.address?.trim()) { errors.address = 'Address is required'; }
    } else if (form.role === 'librarian') {
      if (!form.employee_id?.trim()) { errors.employee_id = 'Employee ID is required'; }
      if (!form.department?.trim()) { errors.department = 'Department is required'; }
    }
    
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    
    setSaving(true);
    try {
      await api.post('/admin/users', form);
      setAlert({ type: 'success', msg: `${form.role} registered successfully` });
      setShowModal(false); setForm(EMPTY_FORM); load();
    } catch (e) {
      setFormErr(e.response?.data?.message || 'Failed to register');
    } finally { setSaving(false); }
  };

  const toggleStatus = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/status`);
      setAlert({ type: 'success', msg: 'Status updated' });
      load();
    } catch { setAlert({ type: 'error', msg: 'Failed to update status' }); }
  };

  const downloadTemplate = (type) => {
    let content;
    let filename;
    if (type === 'student') {
      content = CSV_TEMPLATE_STUDENT;
      filename = 'student_template.csv';
    } else if (type === 'teacher') {
      content = CSV_TEMPLATE_TEACHER;
      filename = 'teacher_template.csv';
    } else {
      content = CSV_TEMPLATE_LIBRARIAN;
      filename = 'librarian_template.csv';
    }
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const users = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const user = {};
      headers.forEach((h, idx) => { user[h] = values[idx] || ''; });
      if (user.name && user.email && user.role) {
        users.push(user);
      }
    }
    return users;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setBulkUploading(true);
    setBulkResults(null);
    
    try {
      const text = await file.text();
      const users = parseCSV(text);
      
      if (users.length === 0) {
        setBulkResults({ success: false, message: 'No valid users found in CSV file' });
        setBulkUploading(false);
        return;
      }

      const response = await api.post('/admin/users/bulk', { users });
      setBulkResults(response.data);
      load();
    } catch (err) {
      setBulkResults({
        success: false,
        message: err.response?.data?.message || 'Failed to upload users'
      });
    } finally {
      setBulkUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetBulkModal = () => {
    setShowBulkModal(false);
    setBulkResults(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Layout title="Users">
      <div className="page-header">
        <div><h2 className="page-title">Users</h2><p className="page-sub">Manage librarians, teachers, and students</p></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={() => setShowBulkModal(true)}>
            Bulk Upload
          </button>
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm(EMPTY_FORM); setFormErr(''); setFieldErrors({}); }}>
            + Register User
          </button>
        </div>
      </div>

      {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.msg}</Alert>}

      <div className="card">
        <div className="card-header">
          <div className="search-bar">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input placeholder="Search name or email…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={{ width: 140 }}>
              <option value="">All Roles</option>
              <option value="librarian">Librarian</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
          <span className="text-muted text-sm">{meta?.total || 0} users</span>
        </div>

        {loading ? <Spinner /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Role</th>
                    <th>ID / Enrollment</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={6}><Empty message="No users found" /></td></tr>
                  ) : users.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.name}</strong></td>
                      <td className="text-muted">{u.email}</td>
                      <td><span className="badge badge-gray">{u.role}</span></td>
                      <td className="font-mono text-sm">{u.enrollment_no || u.employee_id || u.teacher_employee_id || '—'}</td>
                      <td>
                        {u.is_active
                          ? <span className="badge badge-green">Active</span>
                          : <span className="badge badge-red">Disabled</span>}
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${u.is_active ? 'btn-outline' : 'btn-success'}`}
                          onClick={() => toggleStatus(u.id)}
                          title={u.is_active ? 'Deactivate user' : 'Reactivate user'}
                        >
                          {u.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
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
        <Modal
          title="Register New User"
          onClose={() => setShowModal(false)}
          footer={<>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><div className="spinner"/>Saving…</> : 'Register'}
            </button>
          </>}
        >
          {formErr && <Alert type="error">{formErr}</Alert>}
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input name="name" value={form.name} onChange={handleFieldChange} onBlur={handleFieldBlur} placeholder="Full name" />
              {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleFieldChange} onBlur={handleFieldBlur} placeholder="email@college.edu" />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Role *</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="librarian">Librarian</option>
              </select>
            </div>
            <div className="form-group">
              <label>Password * (min 8 chars)</label>
              <input name="password" type="password" value={form.password} onChange={handleFieldChange} onBlur={handleFieldBlur} />
              {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
            </div>
          </div>

          {form.role === 'student' ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Enrollment No *</label>
                  <input name="enrollment_no" value={form.enrollment_no} onChange={handleFieldChange} onBlur={handleFieldBlur} />
                  {fieldErrors.enrollment_no && <span className="field-error">{fieldErrors.enrollment_no}</span>}
                </div>
                <div className="form-group">
                  <label>Course *</label>
                  <input name="course" value={form.course} onChange={handleFieldChange} onBlur={handleFieldBlur} placeholder="B.Tech CS" />
                  {fieldErrors.course && <span className="field-error">{fieldErrors.course}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Semester *</label>
                  <input name="semester" value={form.semester} onChange={handleFieldChange} onBlur={handleFieldBlur} placeholder="3rd" />
                  {fieldErrors.semester && <span className="field-error">{fieldErrors.semester}</span>}
                </div>
                <div className="form-group">
                  <label>Year *</label>
                  <input name="year" type="number" value={form.year} onChange={handleFieldChange} onBlur={handleFieldBlur} placeholder="2" />
                  {fieldErrors.year && <span className="field-error">{fieldErrors.year}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Mobile *</label>
                  <input name="mobile" value={form.mobile} onChange={handleFieldChange} onBlur={handleFieldBlur} />
                  {fieldErrors.mobile && <span className="field-error">{fieldErrors.mobile}</span>}
                </div>
                <div className="form-group">
                  <label>Address *</label>
                  <input name="address" value={form.address} onChange={handleFieldChange} onBlur={handleFieldBlur} />
                  {fieldErrors.address && <span className="field-error">{fieldErrors.address}</span>}
                </div>
              </div>
            </>
          ) : form.role === 'teacher' ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Employee ID *</label>
                  <input name="employee_id" value={form.employee_id} onChange={handleFieldChange} onBlur={handleFieldBlur} />
                  {fieldErrors.employee_id && <span className="field-error">{fieldErrors.employee_id}</span>}
                </div>
                <div className="form-group">
                  <label>Department *</label>
                  <input name="department" value={form.department} onChange={handleFieldChange} onBlur={handleFieldBlur} />
                  {fieldErrors.department && <span className="field-error">{fieldErrors.department}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Designation *</label>
                  <input name="designation" value={form.designation} onChange={handleFieldChange} onBlur={handleFieldBlur} placeholder="e.g. Professor, Lecturer" />
                  {fieldErrors.designation && <span className="field-error">{fieldErrors.designation}</span>}
                </div>
                <div className="form-group">
                  <label>Mobile *</label>
                  <input name="mobile" value={form.mobile} onChange={handleFieldChange} onBlur={handleFieldBlur} />
                  {fieldErrors.mobile && <span className="field-error">{fieldErrors.mobile}</span>}
                </div>
              </div>
              <div className="form-group">
                <label>Address *</label>
                <input name="address" value={form.address} onChange={handleFieldChange} onBlur={handleFieldBlur} />
                {fieldErrors.address && <span className="field-error">{fieldErrors.address}</span>}
              </div>
            </>
          ) : (
            <div className="form-row">
              <div className="form-group">
                <label>Employee ID *</label>
                <input name="employee_id" value={form.employee_id} onChange={handleFieldChange} onBlur={handleFieldBlur} />
                {fieldErrors.employee_id && <span className="field-error">{fieldErrors.employee_id}</span>}
              </div>
              <div className="form-group">
                <label>Department *</label>
                <input name="department" value={form.department} onChange={handleFieldChange} onBlur={handleFieldBlur} />
                {fieldErrors.department && <span className="field-error">{fieldErrors.department}</span>}
              </div>
            </div>
          )}
        </Modal>
      )}

      {showBulkModal && (
        <Modal
          title="Bulk Upload Users"
          onClose={resetBulkModal}
          footer={<>
            <button className="btn btn-outline" onClick={resetBulkModal}>Close</button>
          </>}
        >
          {!bulkResults ? (
            <>
              <p style={{ marginBottom: '16px', color: '#666' }}>
                Upload a CSV file to register multiple users at once. Maximum 100 users per upload.
              </p>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Download Templates</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => downloadTemplate('student')}>
                    Student Template
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => downloadTemplate('teacher')}>
                    Teacher Template
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => downloadTemplate('librarian')}>
                    Librarian Template
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Upload CSV File</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={bulkUploading}
                  style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                />
              </div>

              {bulkUploading && <Spinner />}

              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <p style={{ fontWeight: 600, marginBottom: '8px' }}>CSV Format Requirements:</p>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#666' }}>
                  <li><strong>Required:</strong> name, email, role</li>
                  <li><strong>For Students:</strong> course, semester, year, enrollment_no, mobile, address (optional)</li>
                  <li><strong>For Librarians:</strong> employee_id, department (optional)</li>
                  <li><strong>Role values:</strong> student or librarian</li>
                  <li>If password is empty, default "Password@123" will be used</li>
                </ul>
              </div>
            </>
          ) : (
            <div>
              {bulkResults.success ? (
                <>
                  <Alert type="success">{bulkResults.message}</Alert>
                  {bulkResults.data?.success?.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <p style={{ fontWeight: 600, color: '#22c55e' }}>Successfully Added ({bulkResults.data.success.length}):</p>
                      <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '13px' }}>
                        {bulkResults.data.success.map((s, i) => (
                          <div key={i} style={{ padding: '4px 0' }}>✓ {s.name} ({s.email})</div>
                        ))}
                      </div>
                    </div>
                  )}
                  {bulkResults.data?.failed?.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <p style={{ fontWeight: 600, color: '#ef4444' }}>Failed ({bulkResults.data.failed.length}):</p>
                      <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '13px' }}>
                        {bulkResults.data.failed.map((f, i) => (
                          <div key={i} style={{ padding: '4px 0' }}>✗ {f.email}: {f.reason}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Alert type="error">{bulkResults.message}</Alert>
              )}
            </div>
          )}
        </Modal>
      )}
    </Layout>
  );
}
