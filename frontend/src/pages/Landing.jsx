import React, { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './landing.css';

/* ---------------------------------- data ---------------------------------- */

const COVERS = [
  { genre: 'Fiction',    title: 'The Midnight Atlas', author: 'Amara Osei',    bg: '#8C2F39' },
  { genre: 'Science',    title: 'A Brief Cosmos',     author: 'Dr. I. Rao',    bg: '#1A3A5C' },
  { genre: 'Poetry',     title: 'Paper Lanterns',     author: 'Mei Lin',       bg: '#B8620A' },
  { genre: 'History',    title: 'Empires of Salt',    author: 'J. Whitfield',  bg: '#2E5E4E' },
  { genre: 'Mystery',    title: 'The Ninth Key',      author: 'S. Banerjee',   bg: '#161015' },
  { genre: 'Design',     title: 'Grid & Grace',       author: 'P. Anand',      bg: '#C8392B' },
  { genre: 'Philosophy', title: 'The Quiet Mind',     author: 'Marcus Vale',   bg: '#2F8F8A' },
  { genre: 'Classics',   title: 'Tales Retold',       author: 'Various',       bg: '#7B4B94' },
];

const FEATURES = [
  {
    icon: '📚', tint: '#e8eff7',
    title: 'Catalogue everything',
    body: 'Add books with unique codes and per-copy tracking. Search by title, author, code or category in milliseconds.',
  },
  {
    icon: '🔄', tint: '#eaf4ee',
    title: 'Issue & return in clicks',
    body: 'Pick the exact copy, set due dates automatically, and keep a full borrowing history for every member.',
  },
  {
    icon: '📊', tint: '#fdf4e8',
    title: 'Fines, reports & audits',
    body: 'Automatic fine calculation, Excel exports, audit logs and real-time analytics for the whole library.',
  },
];

const STATS = [
  { num: '25k+', label: 'Books & copies tracked' },
  { num: '3k+',  label: 'Students & teachers served' },
  { num: '4',    label: 'Role-based portals' },
  { num: '24/7', label: 'Catalog always open' },
];

const ROLES = [
  {
    icon: '🎓', tint: '#fdf4e8',
    title: 'Student',
    body: 'Borrow, renew and track everything from one calm dashboard.',
    points: ['Browse the live catalog', 'View issued books & dues', 'Request new titles'],
  },
  {
    icon: '📖', tint: '#e8eff7',
    title: 'Teacher',
    body: "Reserve reference sets and follow your department's shelves.",
    points: ['Browse & borrow books', 'Track issue history', 'Request new titles'],
  },
  {
    icon: '📚', tint: '#eaf4ee',
    title: 'Librarian',
    body: 'Run circulation, members and fines without the paperwork.',
    points: ['Issue & return by copy code', 'Manage students & teachers', 'Collect fines & export reports'],
  },
  {
    icon: '🛡️', tint: '#f3e8f5',
    title: 'Admin',
    body: 'Users, configuration, audits — full control, full visibility.',
    points: ['Manage users & roles', 'Configure fines & durations', 'Audit logs & Excel exports'],
  },
];

const PHONE_ROWS = [
  { title: 'The Midnight Atlas', thumb: '#B8620A', chip: 'Available', chipBg: '#eaf4ee', chipFg: '#1e6b3e' },
  { title: 'A Brief Cosmos',     thumb: '#1A3A5C', chip: 'Issued',    chipBg: '#fdf4e8', chipFg: '#b8620a' },
  { title: 'Paper Lanterns',     thumb: '#C8392B', chip: 'Available', chipBg: '#eaf4ee', chipFg: '#1e6b3e' },
];

/* --------------------------------- artwork --------------------------------- */

function LogoMark() {
  return (
    <span className="fb-logo-mark" aria-hidden="true">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <path d="M12 5.5C10 3.8 7.2 3.5 4 4v13.5c3.2-.5 6-.2 8 1.5 2-1.7 4.8-2 8-1.5V4c-3.2-.5-6-.2-8 1.5Z" fill="#064c37" />
        <path d="M12 5.5v13.5" stroke="#f7f4ee" strokeWidth="1.6" />
      </svg>
    </span>
  );
}

function HeroScene() {
  return (
    <div className="fb-scene" aria-hidden="true">
      <svg viewBox="0 0 520 520" role="presentation">
        {/* slow orbit ring */}
        <circle cx="260" cy="270" r="170" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2" strokeDasharray="4 10" className="fb-spin-slow" />
        {/* arch backdrop */}
        <rect x="100" y="50" width="320" height="400" rx="160" fill="#ffffff" opacity="0.07" />
        {/* sun */}
        <circle cx="405" cy="115" r="32" fill="#F5C243" />
        {/* ground */}
        <ellipse cx="260" cy="455" rx="175" ry="24" fill="#043B2C" />

        {/* book stack seat */}
        <rect x="168" y="396" width="184" height="30" rx="7" fill="#2F8F8A" />
        <rect x="168" y="406" width="184" height="5" fill="#F7F4EE" opacity="0.5" />
        <rect x="184" y="368" width="152" height="28" rx="7" fill="#F2A2B4" />
        <rect x="184" y="378" width="152" height="5" fill="#ffffff" opacity="0.5" />
        <rect x="174" y="340" width="168" height="28" rx="7" fill="#E8622A" />
        <rect x="174" y="350" width="168" height="5" fill="#ffffff" opacity="0.5" />

        {/* seated reader */}
        <rect x="196" y="306" width="110" height="30" rx="15" fill="#247A75" />
        <rect x="228" y="196" width="92" height="120" rx="30" fill="#E8622A" />
        <polygon points="252,196 288,196 270,214" fill="#F7F4EE" />
        <rect x="236" y="312" width="112" height="32" rx="16" fill="#2F8F8A" />
        <rect x="316" y="312" width="30" height="76" rx="15" fill="#2F8F8A" />
        <ellipse cx="331" cy="392" rx="21" ry="10" fill="#161015" />
        <ellipse cx="203" cy="346" rx="18" ry="9" fill="#161015" />
        <circle cx="274" cy="158" r="37" fill="#E8B08A" />
        <path d="M237,158 a37,39 0 0 1 74,0 Z" fill="#292229" />
        <circle cx="308" cy="128" r="12" fill="#292229" />
        <rect x="292" y="232" width="78" height="24" rx="12" fill="#CF5220" transform="rotate(-14 292 244)" />
        <circle cx="366" cy="214" r="11" fill="#E8B08A" />

        {/* open book */}
        <polygon points="282,226 330,240 330,282 282,268" fill="#F7F4EE" />
        <polygon points="330,240 378,226 378,268 330,282" fill="#FFFFFF" />
        <line x1="330" y1="240" x2="330" y2="282" stroke="#D8D3C6" strokeWidth="2" />

        {/* bird */}
        <g className="fb-float-b">
          <ellipse cx="140" cy="150" rx="17" ry="10" fill="#FFFFFF" />
          <polygon points="123,147 112,141 115,152" fill="#FFFFFF" />
          <circle cx="154" cy="143" r="8" fill="#FFFFFF" />
          <polygon points="162,143 169,146 162,149" fill="#E8622A" />
          <circle cx="156" cy="142" r="1.6" fill="#161015" />
          <path d="M132,148 q10,-10 20,-2 q-10,8 -20,2 Z" fill="#43A1D7" />
        </g>

        {/* floating confetti */}
        <path d="M86,88 L90,104 L106,108 L90,112 L86,128 L82,112 L66,108 L82,104 Z" fill="#F5C243" className="fb-float-a" />
        <path d="M90,310 h12 v12 h12 v12 h-12 v12 h-12 v-12 h-12 v-12 h12 Z" fill="#F2A2B4" className="fb-float-c" />
        <circle cx="446" cy="306" r="13" fill="none" stroke="#FFFFFF" strokeWidth="5" className="fb-float-b" />
        <circle cx="436" cy="196" r="8" fill="#F2A2B4" className="fb-float-c" />
        <circle cx="120" cy="228" r="6" fill="#ffffff" opacity="0.8" className="fb-float-a" />
        <path d="M64,198 L66.5,207.5 L76,210 L66.5,212.5 L64,222 L61.5,212.5 L52,210 L61.5,207.5 Z" fill="#ffffff" opacity="0.85" className="fb-float-b" />
      </svg>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="fb-phone" aria-hidden="true">
      <div className="fb-phone-screen">
        <div className="fb-phone-notch" />
        <div>
          <div className="fb-phone-head">Good morning, reader.</div>
          <div className="fb-phone-sub">3 books in your satchel</div>
        </div>
        {PHONE_ROWS.map((r) => (
          <div className="fb-phone-row" key={r.title}>
            <span className="fb-phone-thumb" style={{ background: r.thumb }} />
            <span className="fb-phone-lines">
              <span className="fb-phone-line" style={{ display: 'block' }} />
              <span className="fb-phone-line fb-phone-line--sm" style={{ display: 'block' }} />
            </span>
            <span className="fb-phone-chip" style={{ background: r.chipBg, color: r.chipFg }}>{r.chip}</span>
          </div>
        ))}
        <div className="fb-phone-cta">Browse catalog</div>
      </div>
    </div>
  );
}

/* --------------------------------- reveal ---------------------------------- */

function useReveal(ready) {
  useEffect(() => {
    if (!ready) return undefined;
    const els = document.querySelectorAll('.fb-root .fb-reveal');
    if (!('IntersectionObserver' in window) || els.length === 0) {
      els.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
    // Safety net: never leave content hidden — reveal all after 2.5s
    const fallback = setTimeout(() => {
      document.querySelectorAll('.fb-root .fb-reveal').forEach((el) => el.classList.add('is-in'));
    }, 2500);
    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, [ready]);
}

/* --------------------------------- page ------------------------------------ */

export default function Landing() {
  const { user, loading } = useAuth();
  useReveal(!loading && !user);

  if (loading) return null;
  if (user) return <Navigate to={`/${user.role}`} replace />;

  return (
    <div className="fb-root" id="top">
      {/* Nav */}
      <nav className="fb-nav">
        <div className="fb-nav-inner">
          <span className="fb-logo"><LogoMark /> LibSys</span>
          <Link to="/login" className="fb-pill fb-pill--white fb-pill--nav">Login</Link>
        </div>
      </nav>

      {/* 1 — Forest hero */}
      <section className="fb-band--forest fb-hero">
        <div className="fb-container">
          <div className="fb-hero-grid">
            <div>
              <h1 className="fb-hero-headline">Every great story begins with a book.</h1>
              <p className="fb-hero-sub">
                LibSys is the college library, kept like a reading nook — calm,
                organized, and open to every student and teacher.
              </p>
              <div className="fb-hero-cta">
                <Link to="/login" className="fb-pill fb-pill--white">Login to your library →</Link>
                <a href="#features" className="fb-ghost-link">See how it works</a>
              </div>
              <p className="fb-hero-note">Admin · Librarian · Student · Teacher — one sign-in for every role.</p>
            </div>
            <HeroScene />
          </div>
        </div>
      </section>

      {/* Covers strip (still forest) */}
      <section className="fb-band--forest fb-covers">
        <div className="fb-covers-track">
          {COVERS.map((c) => (
            <div className="fb-cover" key={c.title} style={{ background: c.bg }}>
              <span className="fb-cover-genre">{c.genre}</span>
              <span>
                <span className="fb-cover-rule" style={{ display: 'block', marginBottom: 10 }} />
                <span className="fb-cover-title" style={{ display: 'block' }}>{c.title}</span>
              </span>
              <span className="fb-cover-author">{c.author}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 2 — Cream: the system */}
      <section className="fb-band fb-band--cream" id="features">
        <div className="fb-container">
          <div className="fb-reveal">
            <h2 className="fb-display fb-display--cream">A library that runs itself.</h2>
            <p className="fb-display-sub">Catalogue, circulation, fines and analytics — one calm system for the whole college.</p>
          </div>
          <div className="fb-card-grid">
            {FEATURES.map((f, i) => (
              <div className={`fb-card fb-reveal${i === 0 ? ' is-in' : ''}`} key={f.title}>
                <div className="fb-card-icon" style={{ background: f.tint }}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
          <div className="fb-stats fb-reveal" style={{ marginTop: 64 }}>
            {STATS.map((s) => (
              <div className="fb-stat" key={s.label}>
                <div className="fb-stat-num">{s.num}</div>
                <div className="fb-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 — Sky: in your pocket */}
      <section className="fb-band fb-band--sky">
        <div className="fb-container">
          <div className="fb-split">
            <div className="fb-reveal">
              <h2 className="fb-display fb-display--sky">Your library, in your pocket.</h2>
              <p className="fb-band-copy">
                Check what&apos;s on the shelf, see your due dates, and request
                new titles — from any device, wherever you read.
              </p>
              <div style={{ marginTop: 36 }}>
                <Link to="/login" className="fb-pill fb-pill--dark">Login to continue</Link>
              </div>
            </div>
            <div className="fb-reveal">
              <div className="fb-elevated">
                <PhoneMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 — Cream: roles + CTA */}
      <section className="fb-band fb-band--cream">
        <div className="fb-container">
          <div className="fb-reveal">
            <h2 className="fb-display fb-display--cream">One library, four doors.</h2>
            <p className="fb-display-sub">Everyone gets a portal built for their job.</p>
          </div>
          <div className="fb-roles">
            {ROLES.map((r) => (
              <div className="fb-role fb-reveal" key={r.title}>
                <div className="fb-role-avatar" style={{ background: r.tint }}>{r.icon}</div>
                <h4>{r.title}</h4>
                <p>{r.body}</p>
                <ul className="fb-role-list">
                  {r.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="fb-cta-wrap fb-reveal" style={{ marginTop: 88 }}>
            <h2 className="fb-display fb-display--cream">Ready to open the library?</h2>
            <p className="fb-band-copy">Sign in with your college account and find your next book.</p>
            <div className="fb-cta-actions">
              <Link to="/login" className="fb-pill fb-pill--dark">Login now</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5 — Char footer */}
      <footer className="fb-band--char">
        <div className="fb-footer-inner">
          <div className="fb-footer-top">
            <div className="fb-footer-brand">
              <span className="fb-logo"><LogoMark /> LibSys</span>
              <p>A literary reading nook for the whole college — catalogue, circulation, fines and analytics.</p>
            </div>
            <div className="fb-footer-cols">
              <div className="fb-footer-col">
                <h5>Portals</h5>
                <ul>
                  <li><Link to="/login">Student portal</Link></li>
                  <li><Link to="/login">Teacher portal</Link></li>
                  <li><Link to="/login">Librarian portal</Link></li>
                  <li><Link to="/login">Admin portal</Link></li>
                </ul>
              </div>
              <div className="fb-footer-col">
                <h5>System</h5>
                <ul>
                  <li><Link to="/login">Sign in</Link></li>
                  <li><Link to="/change-password">Change password</Link></li>
                  <li><a href="#top">Back to top</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="fb-footer-bottom">
            <span>© 2026 LibSys · College Library Management System</span>
            <span>Catalogue · Circulation · Fines · Analytics</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
