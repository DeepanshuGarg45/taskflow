import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { Spinner } from './components';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const toast = useToast();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await signup(form.name, form.email, form.password, form.role);
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(124,106,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(34,211,160,0.05) 0%, transparent 50%), var(--bg)',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--accent), #38bdf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 16px',
            boxShadow: '0 8px 32px var(--accent-glow)'
          }}>⚡</div>
          <h1 style={{ fontSize: 32, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>TaskFlow</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>Team Task Management</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          {/* Mode Toggle */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            background: 'var(--bg)', borderRadius: 8, padding: 4, marginBottom: 28
          }}>
            {['login', 'signup'].map(m => (
              <button key={m} className="btn" onClick={() => setMode(m)} style={{
                background: mode === m ? 'var(--bg-card)' : 'transparent',
                color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                justifyContent: 'center', border: 'none', padding: '8px'
              }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            {mode === 'signup' && (
              <div className="form-group">
                <label>Full Name</label>
                <input placeholder="Your name" value={form.name} onChange={set('name')} required />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
            {mode === 'signup' && (
              <div className="form-group">
                <label>Account Type</label>
                <select value={form.role} onChange={set('role')}>
                  <option value="member">Member — join & contribute to projects</option>
                  <option value="admin">Admin — create & manage all projects</option>
                </select>
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
              {loading ? <Spinner size={16} /> : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Demo credentials hint */}
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>
          Create an Admin account to get full access
        </p>
      </div>
    </div>
  );
}
