import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth pages
import Login          from './pages/Login';
import ChangePassword from './pages/ChangePassword';

// Admin pages
import AdminDashboard   from './pages/admin/Dashboard';
import AdminUsers       from './pages/admin/Users';
import { AdminFines, AdminConfig, AdminAudit, AdminBookRequests } from './pages/admin/AdminMisc';

// Librarian pages
import LibrarianDashboard from './pages/librarian/Dashboard';
import LibrarianBooks     from './pages/librarian/Books';
import { IssueBook, IssuedBooks, LibrarianStudents, LibrarianFines, LibrarianTeachers } from './pages/librarian/LibrarianMisc';

// Student pages
import {
  StudentDashboard, StudentProfile, StudentBooks,
  StudentIssued, StudentHistory, StudentFines, StudentRequest
} from './pages/student/StudentPages';

// Teacher pages
import {
  TeacherDashboard, TeacherProfile, TeacherBooks,
  TeacherIssued, TeacherHistory
} from './pages/teacher/TeacherPages';

// ── Route guards ──────────────────────────────────────────────────────────────
function RequireAuth({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  if (user.mustChangePassword && window.location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={
            <RequireAuth><ChangePassword /></RequireAuth>
          } />

          {/* Root */}
          <Route path="/" element={<RootRedirect />} />

          {/* Admin */}
          <Route path="/admin" element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />
          <Route path="/admin/users"         element={<RequireAuth role="admin"><AdminUsers /></RequireAuth>} />
          <Route path="/admin/fines"         element={<RequireAuth role="admin"><AdminFines /></RequireAuth>} />
          <Route path="/admin/config"        element={<RequireAuth role="admin"><AdminConfig /></RequireAuth>} />
          <Route path="/admin/audit"         element={<RequireAuth role="admin"><AdminAudit /></RequireAuth>} />
          <Route path="/admin/book-requests" element={<RequireAuth role="admin"><AdminBookRequests /></RequireAuth>} />

          {/* Librarian */}
          <Route path="/librarian"          element={<RequireAuth role="librarian"><LibrarianDashboard /></RequireAuth>} />
          <Route path="/librarian/books"    element={<RequireAuth role="librarian"><LibrarianBooks /></RequireAuth>} />
          <Route path="/librarian/issue"    element={<RequireAuth role="librarian"><IssueBook /></RequireAuth>} />
          <Route path="/librarian/issued"   element={<RequireAuth role="librarian"><IssuedBooks /></RequireAuth>} />
          <Route path="/librarian/students" element={<RequireAuth role="librarian"><LibrarianStudents /></RequireAuth>} />
          <Route path="/librarian/teachers" element={<RequireAuth role="librarian"><LibrarianTeachers /></RequireAuth>} />
          <Route path="/librarian/fines"    element={<RequireAuth role="librarian"><LibrarianFines /></RequireAuth>} />

          {/* Student */}
          <Route path="/student"          element={<RequireAuth role="student"><StudentDashboard /></RequireAuth>} />
          <Route path="/student/profile"  element={<RequireAuth role="student"><StudentProfile /></RequireAuth>} />
          <Route path="/student/books"    element={<RequireAuth role="student"><StudentBooks /></RequireAuth>} />
          <Route path="/student/issued"   element={<RequireAuth role="student"><StudentIssued /></RequireAuth>} />
          <Route path="/student/history"  element={<RequireAuth role="student"><StudentHistory /></RequireAuth>} />
          <Route path="/student/fines"    element={<RequireAuth role="student"><StudentFines /></RequireAuth>} />
          <Route path="/student/request"  element={<RequireAuth role="student"><StudentRequest /></RequireAuth>} />

          {/* Teacher */}
          <Route path="/teacher"          element={<RequireAuth role="teacher"><TeacherDashboard /></RequireAuth>} />
          <Route path="/teacher/profile"  element={<RequireAuth role="teacher"><TeacherProfile /></RequireAuth>} />
          <Route path="/teacher/books"    element={<RequireAuth role="teacher"><TeacherBooks /></RequireAuth>} />
          <Route path="/teacher/issued"   element={<RequireAuth role="teacher"><TeacherIssued /></RequireAuth>} />
          <Route path="/teacher/history"  element={<RequireAuth role="teacher"><TeacherHistory /></RequireAuth>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
