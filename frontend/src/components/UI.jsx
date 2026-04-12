import React from 'react';

// ── Spinner / Loading ─────────────────────────────────
export const Spinner = () => (
  <div className="loading"><div className="spinner" /> Loading...</div>
);

// ── Alert ─────────────────────────────────────────────
export const Alert = ({ type = 'error', children, onClose }) => (
  <div className={`alert alert-${type}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
    <span>{children}</span>
    {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 0 0 8px', opacity: 0.6 }}>×</button>}
  </div>
);

// ── Badge ─────────────────────────────────────────────
export const Badge = ({ children, color = 'gray' }) => (
  <span className={`badge badge-${color}`}>{children}</span>
);

// ── Pagination ────────────────────────────────────────
export const Pagination = ({ meta, onPage }) => {
  if (!meta || meta.totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= meta.totalPages; i++) {
    if (i === 1 || i === meta.totalPages || Math.abs(i - meta.page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }
  return (
    <div className="pagination">
      <span className="page-info">{meta.total} total</span>
      <button className="page-btn" disabled={!meta.hasPrev} onClick={() => onPage(meta.page - 1)}>‹</button>
      {pages.map((p, i) =>
        p === '...'
          ? <span key={i} className="page-info">…</span>
          : <button key={p} className={`page-btn ${p === meta.page ? 'active' : ''}`} onClick={() => onPage(p)}>{p}</button>
      )}
      <button className="page-btn" disabled={!meta.hasNext} onClick={() => onPage(meta.page + 1)}>›</button>
    </div>
  );
};

// ── Modal ─────────────────────────────────────────────
export const Modal = ({ title, onClose, children, footer }) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="modal">
      <div className="modal-header">
        <span className="modal-title">{title}</span>
        <button className="btn-ghost btn btn-sm" onClick={onClose}>×</button>
      </div>
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-footer">{footer}</div>}
    </div>
  </div>
);

// ── Empty state ───────────────────────────────────────
export const Empty = ({ icon = '📂', message = 'No data found' }) => (
  <div className="empty"><div className="empty-icon">{icon}</div><p>{message}</p></div>
);

// ── Status badge helper ───────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    pending:   { color: 'amber', label: 'Pending' },
    paid:      { color: 'green', label: 'Paid' },
    waived:    { color: 'blue',  label: 'Waived' },
    active:    { color: 'green', label: 'Active' },
    blocked:   { color: 'red',   label: 'Blocked' },
    returned:  { color: 'green', label: 'Returned' },
    issued:    { color: 'blue',  label: 'Issued' },
    overdue:   { color: 'red',   label: 'Overdue' },
    fulfilled: { color: 'green', label: 'Fulfilled' },
    approved:  { color: 'blue',  label: 'Approved' },
    rejected:  { color: 'red',   label: 'Rejected' },
  };
  const { color, label } = map[status] || { color: 'gray', label: status };
  return <Badge color={color}>{label}</Badge>;
};

// ── Form field helpers ────────────────────────────────
export const Field = ({ label, error, children }) => (
  <div className="form-group">
    {label && <label>{label}</label>}
    {children}
    {error && <p className="err-text">{error}</p>}
  </div>
);

// ── Confirm dialog ────────────────────────────────────
export const Confirm = ({ message, onConfirm, onCancel, loading }) => (
  <Modal title="Confirm" onClose={onCancel}
    footer={<>
      <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
      <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
        {loading ? <><div className="spinner" /> Working...</> : 'Confirm'}
      </button>
    </>}>
    <p style={{ fontSize: 14, color: 'var(--text)' }}>{message}</p>
  </Modal>
);
