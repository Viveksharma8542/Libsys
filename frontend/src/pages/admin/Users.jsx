import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { Spinner, Alert, Modal, Pagination, Empty, StatusBadge } from '../../components/UI';
import api from '../../utils/api';

const EMPTY_FORM = {
  name: '', email: '', role: 'student', password: 'Password@123',
  course: '', semester: '', year: '', mobile: '', address: '', enrollment_no: '',
  employee_id: '', department: '',
};

export default function AdminUsers() {
  const [users, setUsers]     = useState([]);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving]   = useState(false);
  const [alert, setAlert]     = useState(null);

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

  return (
    <Layout title="Users">
      <div className="page-header">
        <div><h2 className="page-title">Users</h2><p className="page-sub">Manage librarians and students</p></div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm(EMPTY_FORM); setFormErr(''); }}>
          + Register User
        </button>
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
                      <td><StatusBadge status={u.role === 'librarian' ? 'issued' : 'active'} />{' '}<span className="badge badge-gray">{u.role}</span></td>
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
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
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
    </Layout>
  );
}
