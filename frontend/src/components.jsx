import React from 'react';

export function Avatar({ name = '?', color = '#6366f1', size = '' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={`avatar ${size ? 'avatar-' + size : ''}`} style={{ background: color }} title={name}>
      {initials}
    </div>
  );
}

export function StatusBadge({ status }) {
  const labels = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`badge badge-${priority}`}>{priority}</span>;
}

export function Spinner({ size = 20 }) {
  return <div className="spinner" style={{ width: size, height: size }} />;
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 style={{ fontSize: 20 }}>{title}</h2>
          <button className="btn-icon btn" onClick={onClose} style={{ padding: '4px' }}>✕</button>
        </div>
        {children}
        {footer && <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="empty-state">
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h3>{title}</h3>
      <p style={{ marginBottom: action ? 20 : 0 }}>{subtitle}</p>
      {action}
    </div>
  );
}

export function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date() && true;
}
