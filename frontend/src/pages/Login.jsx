import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/UI';
import './login.css';

const DEMO = [
  { role: 'admin',     label: 'Admin',     icon: '🛡️' },
  { role: 'librarian', label: 'Librarian', icon: '📚' },
  { role: 'student',   label: 'Student',   icon: '🎓' },
];

const CREDS = {
  admin:     { email: 'admin@library.edu',     password: 'Admin@123' },
  librarian: { email: 'librarian@library.edu', password: 'Admin@123' },
  student:   { email: 'amit@student.edu',      password: 'Admin@123' },
};

const MINI_COVERS = [
  { genre: 'Fiction',  title: 'The Midnight Atlas', bg: '#8C2F39' },
  { genre: 'Science',  title: 'A Brief Cosmos',     bg: '#1A3A5C' },
  { genre: 'Poetry',   title: 'Paper Lanterns',     bg: '#B8620A' },
  { genre: 'Mystery',  title: 'The Ninth Key',      bg: '#7B4B94' },
];

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
      const routes = { admin: '/admin', librarian: '/librarian', student: '/student', teacher: '/teacher' };
      navigate(routes[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="li-root">
      {/* Brand panel */}
      <div className="li-brand">
        <span className="li-brand-ring li-brand-ring--a" aria-hidden="true" />
        <span className="li-brand-ring li-brand-ring--b" aria-hidden="true" />
        <div className="li-brand-inner">
          <div className="li-logo">
            <span className="li-logo-mark" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 5.5C10 3.8 7.2 3.5 4 4v13.5c3.2-.5 6-.2 8 1.5 2-1.7 4.8-2 8-1.5V4c-3.2-.5-6-.2-8 1.5Z" fill="#064c37" />
                <path d="M12 5.5v13.5" stroke="#f7f4ee" strokeWidth="1.6" />
              </svg>
            </span>
            LibSys
          </div>
          <h2 className="li-brand-headline">The library is open.</h2>
          <p className="li-brand-sub">
            Sign in to browse the catalog, track your books,
            and find your next great read.
          </p>
          <div className="li-mini-covers" aria-hidden="true">
            {MINI_COVERS.map((c) => (
              <div className="li-mini-cover" key={c.title} style={{ background: c.bg }}>
                <span>{c.genre}</span>
                {c.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="li-form-side">
        <Link to="/" className="li-back">← Back to home</Link>
        <div className="li-card">
          <h1>Welcome back</h1>
          <p className="li-card-sub">Sign in to your library account</p>

          {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <div className="li-field">
              <label htmlFor="li-email">Email</label>
              <div className="li-input-wrap">
                <span className="li-input-icon">✉️</span>
                <input
                  id="li-email"
                  type="email" value={form.email} required
                  onChange={e => set('email', e.target.value)}
                  placeholder="your@email.edu"
                  autoFocus
                />
              </div>
            </div>
            <div className="li-field">
              <label htmlFor="li-password">Password</label>
              <div className="li-input-wrap">
                <span className="li-input-icon">🔒</span>
                <input
                  id="li-password"
                  type="password" value={form.password} required
                  onChange={e => set('password', e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button className="li-submit" type="submit" disabled={loading}>
              {loading ? <><span className="li-spinner" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div className="li-divider"><span>Quick Demo Login</span></div>
          <div className="li-demo-row">
            {DEMO.map(({ role, label, icon }) => (
              <button key={role} type="button" className="li-demo-btn"
                onClick={() => setForm(CREDS[role])}>
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
