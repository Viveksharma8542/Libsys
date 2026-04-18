import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = {
  admin: [
    { label: 'Dashboard',    path: '/admin',               icon: '▦' },
    { label: 'Users',        path: '/admin/users',         icon: '👥' },
    { label: 'Book Requests',path: '/admin/book-requests', icon: '📋' },
    { label: 'Fines',        path: '/admin/fines',         icon: '₹' },
    { label: 'Config',       path: '/admin/config',        icon: '⚙' },
    { label: 'Audit Logs',   path: '/admin/audit',         icon: '📑' },
  ],
  librarian: [
    { label: 'Dashboard',    path: '/librarian',           icon: '▦' },
    { label: 'Books',        path: '/librarian/books',     icon: '📚' },
    { label: 'Issue Book',   path: '/librarian/issue',     icon: '➕' },
    { label: 'Issued Books', path: '/librarian/issued',    icon: '📤' },
    { label: 'Students',     path: '/librarian/students',  icon: '🎓' },
    { label: 'Teachers',     path: '/librarian/teachers',  icon: '👨‍🏫' },
    { label: 'Fines',        path: '/librarian/fines',     icon: '₹' },
    { label: 'Profile',     path: '/librarian/profile',    icon: '👤' },
  ],
  student: [
    { label: 'Dashboard',    path: '/student',             icon: '▦' },
    { label: 'Search Books', path: '/student/books',       icon: '🔍' },
    { label: 'My Books',     path: '/student/issued',       icon: '📚' },
    { label: 'History',     path: '/student/history',      icon: '📋' },
    { label: 'Fines',       path: '/student/fines',        icon: '₹' },
    { label: 'Request Book', path: '/student/request',      icon: '✉' },
    { label: 'Profile',     path: '/student/profile',      icon: '👤' },
  ],
  teacher: [
    { label: 'Dashboard',    path: '/teacher',             icon: '▦' },
    { label: 'Search Books', path: '/teacher/books',       icon: '🔍' },
    { label: 'My Books',    path: '/teacher/issued',       icon: '📚' },
    { label: 'History',    path: '/teacher/history',      icon: '📋' },
    { label: 'Profile',    path: '/teacher/profile',      icon: '👤' },
  ],
};

const ROLE_LABELS = { admin: 'Administration', librarian: 'Library Staff', student: 'Student Portal', teacher: 'Teacher Portal' };

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  if (!user) return null;
  const items = NAV[user.role] || [];
  const initials = user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>📖 LibSys</h1>
        <span>{ROLE_LABELS[user.role]}</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu</div>
        {items.map(item => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={logout}>Sign Out</button>
      </div>
    </aside>
  );
}
