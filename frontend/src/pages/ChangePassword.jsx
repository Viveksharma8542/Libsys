import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/UI';
import api from '../utils/api';

export default function ChangePassword() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      updateUser({ mustChangePassword: false });
      setSuccess('Password changed! Redirecting...');
      setTimeout(() => {
        const routes = { admin: '/admin', librarian: '/librarian', student: '/student' };
        navigate(routes[user?.role] || '/');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <h1>🔑 Change Password</h1>
          <p>You must set a new password to continue</p>
        </div>
        {error   && <Alert type="error"   onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" value={form.currentPassword} required
              onChange={e => set('currentPassword', e.target.value)} placeholder="••••••••" />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={form.newPassword} required
              onChange={e => set('newPassword', e.target.value)} placeholder="Min 8 chars, 1 uppercase, 1 number" />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" value={form.confirm} required
              onChange={e => set('confirm', e.target.value)} placeholder="••••••••" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? <><div className="spinner" /> Updating...</> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
