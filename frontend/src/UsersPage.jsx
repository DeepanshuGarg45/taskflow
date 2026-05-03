import React, { useState, useEffect } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { Spinner, Avatar, EmptyState } from './components';

export default function UsersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.users().then(d => setUsers(d.users)).catch(e => toast(e.message, 'error')).finally(() => setLoading(false));
  }, []);

  if (user.role !== 'admin') {
    return (
      <div className="fade-in">
        <h1>Access Denied</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Only admins can view this page.</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>Team Members</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
      ) : users.length === 0 ? (
        <EmptyState icon="👥" title="No users yet" subtitle="Users will appear here once they sign up." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                {['User', 'Email', 'Role', 'Joined'].map(h => (
                  <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-display)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={u.name} color={u.avatar_color} />
                      <div>
                        <p style={{ fontWeight: 500, fontSize: 14 }}>{u.name}</p>
                        {u.id === user.id && <p style={{ fontSize: 11, color: 'var(--accent)' }}>You</p>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 14, color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className={`badge badge-${u.role}`}>{u.role}</span>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 13, color: 'var(--text-muted)' }}>
                    {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
