import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const ROLE_TITLES = {
  admin:     'Admin Panel',
  librarian: 'Library Management',
  student:   'Student Portal',
};

export default function Layout({ children, title }) {
  const { user } = useAuth();

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <header className="topbar">
          <span className="topbar-title">{title || 'Library Management System'}</span>
          <span className="topbar-badge">{ROLE_TITLES[user?.role]}</span>
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
