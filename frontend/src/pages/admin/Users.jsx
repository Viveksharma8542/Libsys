import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Alert, Modal, Pagination, Empty } from '../../components/UI';
import api from '../../utils/api';

const EMPTY_FORM = {
  name: '', email: '', role: 'student', password: 'Password@123',
  course: '', semester: '', year: '', mobile: '', address: '', enrollment_no: '',
  employee_id: '', department: '',
};

const CSV_TEMPLATE = `name,email,role,password,course,semester,year,mobile,address,enrollment_no,employee_id,department
John Doe,john@example.com,student,Password@123,B.Tech CS,5th,3,9876543210,123 Main St,ENR001,,
Jane Smith,jane@example.com,student,Password@123,B.Sc Math,3rd,2,9876543211,456 Oak Ave,ENR002,,
Mike Johnson,mike@example.com,librarian,Password@123,,,,,,,EMP001,Library Science`;

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

  const handleSave = async () => {
    setFormErr('');
    if (!form.name || !form.email) { setFormErr('Name and email are required'); return; }
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
    let content = type === 'student' ? CSV_TEMPLATE : CSV_TEMPLATE_LIBRARIAN;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'student' ? 'student_template.csv' : 'librarian_template.csv';
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
        <div><h2 className="page-title">Users</h2><p className="page-sub">Manage librarians and students</p></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={() => setShowBulkModal(true)}>
            Bulk Upload
          </button>
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm(EMPTY_FORM); setFormErr(''); }}>
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
            <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={{ width: 130 }}>
              <option value="">All Roles</option>
              <option value="librarian">Librarian</option>
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
                    <th>Enrollment / Employee</th><th>Status</th><th>Actions</th>
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
                      <td className="font-mono text-sm">{u.enrollment_no || u.employee_id || '—'}</td>
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
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@college.edu" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Role *</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="student">Student</option>
                <option value="librarian">Librarian</option>
              </select>
            </div>
            <div className="form-group">
              <label>Password</label>
              <input value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
          </div>

          {form.role === 'student' ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Enrollment No</label>
                  <input value={form.enrollment_no} onChange={e => set('enrollment_no', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Course</label>
                  <input value={form.course} onChange={e => set('course', e.target.value)} placeholder="B.Tech CS" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Semester</label>
                  <input value={form.semester} onChange={e => set('semester', e.target.value)} placeholder="3rd" />
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input type="number" value={form.year} onChange={e => set('year', e.target.value)} placeholder="2" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Mobile</label>
                  <input value={form.mobile} onChange={e => set('mobile', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input value={form.address} onChange={e => set('address', e.target.value)} />
                </div>
              </div>
            </>
          ) : (
            <div className="form-row">
              <div className="form-group">
                <label>Employee ID</label>
                <input value={form.employee_id} onChange={e => set('employee_id', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input value={form.department} onChange={e => set('department', e.target.value)} />
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
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => downloadTemplate('student')}>
                    Student Template
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
