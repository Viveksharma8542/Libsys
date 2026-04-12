import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/UI';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.mustChangePassword) { navigate('/change-password'); return; }
      const routes = { admin: '/admin', librarian: '/librarian', student: '/student' };
      navigate(routes[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  const fillDemo = (role) => {
    const creds = {
      admin:     { email: 'admin@library.edu',     password: 'Admin@123' },
      librarian: { email: 'librarian@library.edu', password: 'Admin@123' },
      student:   { email: 'amit@student.edu',      password: 'Admin@123' },
    };
    setForm(creds[role]);
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <h1>📖 LibSys</h1>
          <p>College Library Management System</p>
        </div>

        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email" value={form.email} required
              onChange={e => set('email', e.target.value)}
              placeholder="your@email.edu"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password" value={form.password} required
              onChange={e => set('password', e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            {loading ? <><div className="spinner" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <hr className="divider" />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center' }}>Demo quick login</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {['admin','librarian','student'].map(r => (
            <button key={r} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => fillDemo(r)}>{r}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
