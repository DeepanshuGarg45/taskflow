import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { useAuth } from './AuthContext';
import { Avatar } from './components';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'All Tasks' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 12px' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 32 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--accent), #38bdf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          boxShadow: '0 4px 16px var(--accent-glow)', flexShrink: 0
        }}>⚡</div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>TaskFlow</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 10px', marginBottom: 8 }}>Navigation</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 8, marginBottom: 2,
            textDecoration: 'none', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 500,
            transition: 'all 0.15s',
            background: isActive ? 'var(--accent-dim)' : 'transparent',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
          })}>
            <Icon size={17} />
            {label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <NavLink to="/users" onClick={() => setMobileOpen(false)} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 8, marginTop: 2,
            textDecoration: 'none', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 500,
            transition: 'all 0.15s',
            background: isActive ? 'var(--accent-dim)' : 'transparent',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
          })}>
            <Users size={17} />
            Users
          </NavLink>
        )}
      </nav>

      {/* User section */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--bg-hover)' }}>
          <Avatar name={user?.name} color={user?.avatar_color} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role}</p>
          </div>
          <button className="btn btn-icon" style={{ padding: '4px' }} onClick={handleLogout} title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: 220, background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
        flexShrink: 0, display: 'none', flexDirection: 'column',
        ['@media(min-width:768px)']: { display: 'flex' }
      }} className="sidebar-desktop">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setMobileOpen(false)} />
          <aside style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 240, background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile header */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }} className="mobile-header">
          <button className="btn btn-icon" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>TaskFlow</span>
        </header>

        <main style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          {children}
        </main>
      </div>

      <style>{`
        .sidebar-desktop { display: flex !important; }
        .mobile-header { display: none !important; }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .mobile-header { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
