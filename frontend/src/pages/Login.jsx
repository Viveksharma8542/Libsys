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
      <div className="login-brand">
        <div className="login-brand-content">
          <div className="login-brand-name">
            <span className="brand-icon">📚</span>
            <h1><span className="brand-lib">Lib</span><span className="brand-sys">Sys</span></h1>
          </div>
          <p className="login-brand-desc">College Library Management System</p>
          <div className="login-brand-features">
            <div className="feature-item"><span>📖</span> Manage Books Collection</div>
            <div className="feature-item"><span>👥</span> Track Students &amp; Teachers</div>
            <div className="feature-item"><span>⚡</span> Auto Fine Calculation</div>
            <div className="feature-item"><span>📊</span> Real-time Analytics</div>
          </div>
        </div>
        <div className="login-brand-bg" />
      </div>
      <div className="login-form-wrap">
        <div className="login-box">
          <div className="login-logo">
            <h1>Welcome Back</h1>
            <p>Sign in to your account</p>
          </div>

          {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <div className="input-icon-wrap">
                <span className="input-icon">✉️</span>
                <input
                  type="email" value={form.email} required
                  onChange={e => set('email', e.target.value)}
                  placeholder="your@email.edu"
                  autoFocus
                />
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-icon-wrap">
                <span className="input-icon">🔒</span>
                <input
                  type="password" value={form.password} required
                  onChange={e => set('password', e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button className="btn btn-primary btn-login" type="submit" disabled={loading}>
              {loading ? <><div className="spinner" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div className="login-demo">
            <div className="divider-text"><span>Quick Demo Login</span></div>
            <div className="demo-buttons">
              {[
                { role: 'admin',     label: 'Admin',     icon: '🛡️', color: '#1a3a5c' },
                { role: 'librarian', label: 'Librarian', icon: '📚', color: '#1e6b3e' },
                { role: 'student',   label: 'Student',   icon: '🎓', color: '#b8620a' },
              ].map(({ role, label, icon, color }) => (
                <button key={role} className="demo-btn" style={{ '--btn-color': color }}
                  onClick={() => fillDemo(role)}>
                  <span>{icon}</span> {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
