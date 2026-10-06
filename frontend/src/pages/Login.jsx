import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/UI';
import api from '../utils/api';
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

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const ROUTES = { admin: '/admin', librarian: '/librarian', student: '/student', teacher: '/teacher' };

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate  = useNavigate();
  const googleBtnRef = useRef(null);

  // login form
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // google
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError]     = useState('');

  // forgot-password flow: login -> forgot -> otp -> reset -> done
  const [mode, setMode]       = useState('login');
  const [info, setInfo]       = useState('');
  const [fpEmail, setFpEmail] = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState('');
  const [otp, setOtp]         = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [pw1, setPw1]         = useState('');
  const [pw2, setPw2]         = useState('');
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const goToDashboard = (user) => {
    if (user.mustChangePassword) { navigate('/change-password'); return; }
    navigate(ROUTES[user.role] || '/');
  };

  /* ---------- Google Identity Services ---------- */
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;
    const boot = () => {
      try {
        if (!window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          // eslint-disable-next-line no-use-before-define
          callback: (resp) => handleGoogle(resp?.credential),
        });
        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline', size: 'large', width: 320, text: 'signin_with', shape: 'pill',
          });
        }
      } catch { /* Google button unavailable — email login still works */ }
    };
    if (window.google?.accounts?.id) { boot(); return undefined; }
    if (!document.querySelector('script[data-gis]')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.gis = '1';
      script.onload = boot;
      document.head.appendChild(script);
    } else {
      const t = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(t); boot(); }
      }, 300);
      const stop = setTimeout(() => clearInterval(t), 8000);
      return () => { clearInterval(t); clearTimeout(stop); };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogle = async (credential) => {
    setGoogleError('');
    if (!credential) { setGoogleError('Google sign-in was cancelled.'); return; }
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle(credential);
      goToDashboard(user);
    } catch (err) {
      setGoogleError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally { setGoogleLoading(false); }
  };

  /* ---------- Email + password ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      goToDashboard(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  /* ---------- Forgot password flow ---------- */
  const startForgot = () => {
    setMode('forgot');
    setFpEmail(form.email || '');
    setFpError('');
  };

  const sendOtp = async (e) => {
    if (e) e.preventDefault();
    setFpError('');
    if (!fpEmail.trim()) { setFpError('Enter your account email first.'); return; }
    setFpLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: fpEmail.trim() });
      setOtp('');
      setOtpError('');
      setMode('otp');
      setFpError('');
      setInfo(data.message);
    } catch (err) {
      setFpError(err.response?.data?.message || 'Could not send the code. Please try again.');
    } finally { setFpLoading(false); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    if (otp.trim().length !== 6) { setOtpError('Enter the 6-digit code from your email.'); return; }
    setOtpLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email: fpEmail.trim(), otp: otp.trim() });
      setResetToken(data.data.resetToken);
      setPw1(''); setPw2(''); setResetError('');
      setMode('reset');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally { setOtpLoading(false); }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setResetError('');
    if (pw1.length < 8) { setResetError('Password must be at least 8 characters.'); return; }
    if (pw1 !== pw2) { setResetError('Passwords do not match.'); return; }
    setResetLoading(true);
    try {
      await api.post('/auth/reset-password', { email: fpEmail.trim(), resetToken, newPassword: pw1 });
      setMode('done');
    } catch (err) {
      setResetError(err.response?.data?.message || 'Reset failed. Please start again.');
    } finally { setResetLoading(false); }
  };

  const backToLogin = () => {
    setMode('login');
    setError(''); setFpError(''); setOtpError(''); setResetError('');
    setInfo('');
  };

  return (
    <div className="li-root">
      {/* Brand panel */}
      <div className="li-brand">
        <span className="li-glow li-glow--a" aria-hidden="true" />
        <span className="li-glow li-glow--b" aria-hidden="true" />
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
          <div className="li-brand-art" aria-hidden="true">
            <svg width="120" height="86" viewBox="0 0 120 86" fill="none">
              <rect x="14" y="62" width="92" height="10" rx="3" fill="#2f8f8a" />
              <rect x="20" y="50" width="80" height="10" rx="3" fill="#f2a2b4" />
              <rect x="26" y="38" width="68" height="10" rx="3" fill="#e8622a" />
              <path d="M60 34 C48 22 52 8 60 4 C68 8 72 22 60 34Z" fill="#f7f4ee" opacity="0.9" />
              <circle cx="98" cy="18" r="7" fill="#f5c243" />
              <path d="M18 12 l2.2 5.8 5.8 2.2 -5.8 2.2 -2.2 5.8 -2.2 -5.8 -5.8 -2.2 5.8 -2.2 Z" fill="#f5c243" opacity="0.9" />
            </svg>
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
          {mode === 'login' && (
            <>
              <h1>Welcome back</h1>
              <p className="li-card-sub">Sign in to your library account</p>

              {GOOGLE_CLIENT_ID ? (
                <>
                  <div className="li-google-wrap">
                    <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />
                    {googleLoading && <p className="li-hint">Signing you in with Google…</p>}
                  </div>
                  {googleError && <Alert type="error" onClose={() => setGoogleError('')}>{googleError}</Alert>}
                  <div className="li-divider"><span>or continue with email</span></div>
                </>
              ) : null}

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
                      type={showPw ? 'text' : 'password'} value={form.password} required
                      onChange={e => set('password', e.target.value)}
                      placeholder="••••••••"
                    />
                    <button type="button" className="li-eye" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                      {showPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div className="li-row-between">
                  <span />
                  <button type="button" className="li-link" onClick={startForgot}>Forgot password?</button>
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
            </>
          )}

          {mode === 'forgot' && (
            <>
              <h1>Reset password</h1>
              <p className="li-card-sub">Enter your account email — we&apos;ll send a 6-digit code.</p>
              {fpError && <Alert type="error" onClose={() => setFpError('')}>{fpError}</Alert>}
              <form onSubmit={sendOtp}>
                <div className="li-field">
                  <label htmlFor="li-fp-email">Email</label>
                  <div className="li-input-wrap">
                    <span className="li-input-icon">✉️</span>
                    <input
                      id="li-fp-email"
                      type="email" value={fpEmail} required
                      onChange={e => setFpEmail(e.target.value)}
                      placeholder="your@email.edu"
                      autoFocus
                    />
                  </div>
                </div>
                <button className="li-submit" type="submit" disabled={fpLoading}>
                  {fpLoading ? <><span className="li-spinner" /> Sending code…</> : 'Send Code'}
                </button>
              </form>
              <div className="li-center"><button type="button" className="li-link" onClick={backToLogin}>← Back to sign in</button></div>
            </>
          )}

          {mode === 'otp' && (
            <>
              <div className="li-steps"><span className="on" /><span className="on" /><span /></div>
              <h1>Check your email</h1>
              <p className="li-card-sub">
                {info || `We sent a 6-digit code to ${fpEmail}. It expires in 10 minutes.`}
              </p>
              {otpError && <Alert type="error" onClose={() => setOtpError('')}>{otpError}</Alert>}
              <form onSubmit={verifyOtp}>
                <div className="li-field">
                  <label htmlFor="li-otp">6-digit code</label>
                  <input
                    id="li-otp"
                    className="li-otp"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp} required
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>
                <button className="li-submit" type="submit" disabled={otpLoading}>
                  {otpLoading ? <><span className="li-spinner" /> Verifying…</> : 'Verify Code'}
                </button>
              </form>
              <div className="li-center">
                <button type="button" className="li-link" onClick={sendOtp} disabled={fpLoading}>
                  {fpLoading ? 'Sending…' : 'Resend code'}
                </button>
                <span className="li-dot">·</span>
                <button type="button" className="li-link" onClick={backToLogin}>Back to sign in</button>
              </div>
            </>
          )}

          {mode === 'reset' && (
            <>
              <div className="li-steps"><span className="on" /><span className="on" /><span className="on" /></div>
              <h1>Create new password</h1>
              <p className="li-card-sub">Code verified ✓ — now choose a new password. Min 8 characters, with an uppercase letter and a number.</p>
              {resetError && <Alert type="error" onClose={() => setResetError('')}>{resetError}</Alert>}
              <form onSubmit={submitReset}>
                <div className="li-field">
                  <label htmlFor="li-pw1">New password</label>
                  <div className="li-input-wrap">
                    <span className="li-input-icon">🔒</span>
                    <input
                      id="li-pw1"
                      type={showPw1 ? 'text' : 'password'} value={pw1} required minLength={8}
                      onChange={e => setPw1(e.target.value)}
                      placeholder="Min 8 characters"
                      autoFocus
                    />
                    <button type="button" className="li-eye" onClick={() => setShowPw1(v => !v)} aria-label={showPw1 ? 'Hide password' : 'Show password'}>
                      {showPw1 ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div className="li-field">
                  <label htmlFor="li-pw2">Confirm new password</label>
                  <div className="li-input-wrap">
                    <span className="li-input-icon">🔒</span>
                    <input
                      id="li-pw2"
                      type={showPw2 ? 'text' : 'password'} value={pw2} required
                      onChange={e => setPw2(e.target.value)}
                      placeholder="Repeat new password"
                    />
                    <button type="button" className="li-eye" onClick={() => setShowPw2(v => !v)} aria-label={showPw2 ? 'Hide password' : 'Show password'}>
                      {showPw2 ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <button className="li-submit" type="submit" disabled={resetLoading}>
                  {resetLoading ? <><span className="li-spinner" /> Saving…</> : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {mode === 'done' && (
            <div className="li-center">
              <div className="li-success">✓</div>
              <h1>Password changed!</h1>
              <p className="li-card-sub" style={{ marginBottom: 28 }}>
                Your password was reset successfully — a confirmation email is on its way to <strong>{fpEmail}</strong>.
              </p>
              <button className="li-submit" type="button" onClick={backToLogin}>Back to Sign In</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
