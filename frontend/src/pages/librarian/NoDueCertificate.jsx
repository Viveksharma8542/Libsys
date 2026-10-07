import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../utils/api';
import '../landing.css';

export default function NoDueCertificate() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const base = location.pathname.startsWith('/admin') ? '/admin' : '/librarian';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/librarian/students/${studentId}/no-due`)
      .then(r => setData(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Could not load certificate'))
      .finally(() => setLoading(false));
  }, [studentId]);

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const certNo = data ? `NDC-${new Date().getFullYear()}-${String(data.student.enrollment_no || data.student.id).slice(-6).toUpperCase()}` : '';

  return (
    <div className="fb-root" style={{ background: '#e9e4d8', minHeight: '100vh', padding: '40px 20px' }}>
      <style>{`
        @media print {
          .ndc-actions { display: none !important; }
          .ndc-page { box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>

      <div className="ndc-actions" style={{ maxWidth: 760, margin: '0 auto 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link to={`${base}/students`} className="fb-pill fb-pill--dark fb-pill--sm">← Back to students</Link>
        <button className="fb-pill fb-pill--dark fb-pill--sm" style={{ background: '#064c37' }} onClick={() => window.print()}>
          🖨️ Print / Save as PDF
        </button>
      </div>

      {loading && <p style={{ textAlign: 'center', color: '#3f383d' }}>Loading certificate…</p>}
      {error && <p style={{ textAlign: 'center', color: '#c8392b' }}>{error}</p>}

      {data && !data.eligible && (
        <div className="ndc-page" style={pageStyle}>
          <h2 style={titleStyle}>No-Due Cannot Be Issued</h2>
          <p style={{ color: '#3f383d', marginTop: 12 }}>
            <strong>{data.student.name}</strong> still has {data.activeIssues.length} book(s) to return
            {data.pendingFine > 0 && <> and an unpaid fine of <strong>₹{parseFloat(data.pendingFine).toFixed(2)}</strong></>}.
            Clear these first, then re-open this certificate.
          </p>
          <div style={{ marginTop: 20 }}>
            <button className="fb-pill fb-pill--dark fb-pill--sm" onClick={() => navigate(`${base}/students`)}>
              Back to students
            </button>
          </div>
        </div>
      )}

      {data && data.eligible && (
        <div className="ndc-page" style={pageStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={logoStyle} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5.5C10 3.8 7.2 3.5 4 4v13.5c3.2-.5 6-.2 8 1.5 2-1.7 4.8-2 8-1.5V4c-3.2-.5-6-.2-8 1.5Z" fill="#064c37" />
                <path d="M12 5.5v13.5" stroke="#f7f4ee" strokeWidth="1.6" />
              </svg>
            </span>
            <div>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22 }}>LibSys</div>
              <div style={{ fontSize: 12, color: '#3f383d', letterSpacing: '-0.2px' }}>College Library Management System</div>
            </div>
          </div>

          <div style={{ borderTop: '3px solid #064c37', margin: '16px 0 24px' }} />

          <h1 style={titleStyle}>No-Due Certificate</h1>
          <p style={{ fontSize: 13, color: '#3f383d', marginTop: 6 }}>
            Certificate No: <strong>{certNo}</strong> · Issued on: <strong>{today}</strong>
          </p>

          <p style={{ fontSize: 16, lineHeight: 1.7, marginTop: 28, color: '#161015' }}>
            This is to certify that <strong>{data.student.name}</strong>
            {data.student.enrollment_no && <>, Enrollment No. <strong>{data.student.enrollment_no}</strong></>}
            {data.student.course && <>, <strong>{data.student.course}</strong></>},
            has <strong>no books currently issued</strong> in their name and
            <strong> no pending fines</strong> as of {today}.
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <div style={checkStyle}>✓ Zero books to return</div>
            <div style={checkStyle}>✓ Zero unpaid fines</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 64, gap: 24, flexWrap: 'wrap' }}>
            <div style={signStyle}>Librarian signature<br /><span style={{ fontSize: 11, color: '#3f383d' }}>with library seal</span></div>
            <div style={signStyle}>Date: {today}</div>
          </div>

          <p style={{ fontSize: 11, color: '#3f383d', marginTop: 40, letterSpacing: '-0.1px' }}>
            System-generated by LibSys · verified against live library records at the time of issue.
          </p>
        </div>
      )}
    </div>
  );
}

const pageStyle = {
  maxWidth: 760,
  margin: '0 auto',
  background: '#ffffff',
  borderRadius: 12,
  padding: '48px 52px',
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.4)',
};

const titleStyle = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontWeight: 400,
  fontSize: 40,
  lineHeight: 1,
  color: '#161015',
};

const logoStyle = {
  width: 38, height: 38, borderRadius: 10, background: '#f7f4ee',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

const checkStyle = {
  fontSize: 14, fontWeight: 500, color: '#064c37',
  background: '#e2efe8', borderRadius: 60, padding: '10px 18px',
};

const signStyle = {
  fontSize: 14, color: '#161015', borderTop: '1px solid #161015',
  paddingTop: 8, minWidth: 200,
};
