import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Spinner } from '../../components/UI';

import api from '../../utils/api';

export default function AdminDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [feed, setFeed]       = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [filter, setFilter]   = useState('ALL');
  const [lastRefresh, setLastRefresh] = useState(null);

  // Fetch dashboard stats
  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  // Fetch + auto-refresh activity feed every 30s
  const fetchFeed = () => {
    api.get('/admin/activity-feed?limit=30')
      .then(r => { setFeed(r.data.data || []); setLastRefresh(new Date()); })
      .finally(() => setFeedLoading(false));
  };
  useEffect(() => {
    fetchFeed();
    const id = setInterval(fetchFeed, 30000);
    return () => clearInterval(id);
  }, []);

  const EVENT_META = {
    ISSUE_BOOK:  { label: 'Issued',   color: '#378ADD', bg: '#EAF3FB', icon: '📤' },
    RETURN_BOOK: { label: 'Returned', color: '#16a34a', bg: '#EDFBF1', icon: '📥' },
    FINE_PAID:   { label: 'Fine Paid',color: '#d97706', bg: '#FEF5E7', icon: '💰' },
    OVERDUE:     { label: 'Overdue',  color: '#dc2626', bg: '#FEEDED', icon: '⚠️' },
  };

  const timeAgo = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  const formatEventText = (ev) => {
    const name = ev.borrower_name || 'Unknown';
    const book = ev.book_title    || 'Unknown Book';
    const role = ev.borrower_role === 'teacher' ? 'Teacher' : 'Student';
    switch (ev.action) {
      case 'ISSUE_BOOK':  return <><strong>{name}</strong> ({role}) borrowed <em>"{book}"</em>{ev.due_date ? ` — due ${new Date(ev.due_date).toLocaleDateString('en-IN')}` : ''}</>;
      case 'RETURN_BOOK': return <><strong>{name}</strong> ({role}) returned <em>"{book}"</em></>;
      case 'FINE_PAID':   return <><strong>{name}</strong> paid ₹{parseFloat(ev.amount).toFixed(0)} fine for <em>"{book}"</em> ({ev.days_late} day{ev.days_late !== 1 ? 's' : ''} late)</>;
      case 'OVERDUE':     return <><strong>{name}</strong>'s copy of <em>"{book}"</em> is <strong style={{color:'#dc2626'}}>{ev.days_overdue} day{ev.days_overdue !== 1 ? 's' : ''} overdue</strong></>;
      default:            return book;
    }
  };

  const filtered = filter === 'ALL' ? feed : feed.filter(e => e.action === filter);

  if (loading) return <Layout title="Dashboard"><Spinner /></Layout>;
  if (!data)   return <Layout title="Dashboard"><p>Failed to load.</p></Layout>;

  return (
    <Layout title="Dashboard">
      <div className="page-header">
        <div>
          <h2 className="page-title">Admin Dashboard</h2>
          <p className="page-sub">System overview</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-label">Total Books</div>
          <div className="stat-value">{data.books.total}</div>
          <div className="stat-sub">{data.books.available} available</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Issued Books</div>
          <div className="stat-value">{data.issued}</div>
          <div className="stat-sub">currently out</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Overdue</div>
          <div className="stat-value">{data.overdue}</div>
          <div className="stat-sub">need follow-up</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Pending Fines</div>
          <div className="stat-value">₹{data.pendingFines.total}</div>
          <div className="stat-sub">{data.pendingFines.count} records</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Librarians</div>
          <div className="stat-value">{data.users.librarian || 0}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Teachers</div>
          <div className="stat-value">{data.users.teacher || 0}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Students</div>
          <div className="stat-value">{data.users.student || 0}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Book Requests</div>
          <div className="stat-value">{data.bookRequests}</div>
          <div className="stat-sub">pending requests</div>
        </div>
      </div>

     {/* ── Live Activity Feed ── */}
      <div className="card" style={{ marginBottom: 20 }}>

        {/* Feed header */}
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="card-title">Live Activity Feed</span>
            <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#22c55e', opacity: 0.5, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }}/>
              <span style={{ borderRadius: '50%', background: '#22c55e', width: 8, height: 8 }}/>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {lastRefresh && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Updated {timeAgo(lastRefresh)}
              </span>
            )}
            <button
              onClick={fetchFeed}
              style={{ fontSize: 11, padding: '3px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
            >↻ Refresh</button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, padding: '10px 16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          {['ALL', 'ISSUE_BOOK', 'RETURN_BOOK', 'FINE_PAID', 'OVERDUE'].map(f => {
            const meta = EVENT_META[f];
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  fontSize: 11.5, padding: '4px 11px', borderRadius: 20, cursor: 'pointer',
                  border: active ? `1.5px solid ${meta?.color || 'var(--primary)'}` : '1px solid var(--border)',
                  background: active ? (meta?.bg || 'var(--primary-light)') : 'transparent',
                  color: active ? (meta?.color || 'var(--primary)') : 'var(--text-muted)',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {meta ? `${meta.icon} ${meta.label}` : '🕐 All Events'}
                {f !== 'ALL' && (
                  <span style={{ marginLeft: 5, background: active ? meta.color : 'var(--border)', color: active ? '#fff' : 'var(--text-muted)', borderRadius: 10, padding: '0 5px', fontSize: 10 }}>
                    {feed.filter(e => e.action === f).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feed list */}
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {feedLoading ? (
            <div style={{ padding: 32, textAlign: 'center' }}><Spinner /></div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No recent activity found.
            </div>
          ) : filtered.map((ev, i) => {
            const meta = EVENT_META[ev.action] || EVENT_META['ISSUE_BOOK'];
            return (
              <div
                key={ev.id + i}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '11px 16px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover, #f9fafb)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, marginTop: 1 }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.45 }}>
                    {formatEventText(ev)}
                  </div>
                  {ev.staff_name && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      by {ev.staff_name}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {timeAgo(ev.time)}
                  </span>
                  <span style={{ fontSize: 9.5, padding: '2px 7px', borderRadius: 10, background: meta.bg, color: meta.color, fontWeight: 600, letterSpacing: 0.3 }}>
                    {meta.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes ping { 75%,100%{transform:scale(2);opacity:0} }`}</style>
    </Layout>
  );
}
