import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const ROLE_TITLES = {
  admin:     'Admin Panel',
  librarian: 'Library Management',
  student:   'Student Portal',
  teacher:   'Teacher Portal',
};

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const goProfile = () => { setMenuOpen(false); navigate(`/${user.role}/profile`); };
  const doLogout = async () => { setMenuOpen(false); await logout(); navigate('/'); };

  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(o => !o)} aria-label="Open navigation menu">☰</button>
          <span className="topbar-title">{title || 'Library Management System'}</span>
          <span className="topbar-badge">{ROLE_TITLES[user?.role]}</span>
          <div className="topbar-user-wrap" ref={menuRef}>
            <button
              className="topbar-user"
              onClick={() => setMenuOpen(o => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="topbar-avatar">{initials}</span>
              <span className="topbar-username">{user?.name}</span>
              <span className={`topbar-chevron${menuOpen ? ' open' : ''}`}>▾</span>
            </button>
            {menuOpen && (
              <div className="user-menu" role="menu">
                <div className="user-menu-header">
                  <div className="user-menu-name">{user?.name}</div>
                  <div className="user-menu-role">{user?.role}</div>
                </div>
                <div className="user-menu-divider" />
                <button className="user-menu-item" onClick={goProfile} role="menuitem">
                  <span>👤</span> Profile
                </button>
                <button className="user-menu-item user-menu-item--danger" onClick={doLogout} role="menuitem">
                  <span>🚪</span> Logout
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
