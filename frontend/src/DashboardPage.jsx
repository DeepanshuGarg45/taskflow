import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';
import { Spinner, StatusBadge, PriorityBadge, Avatar, formatDate } from './components';
import { FolderKanban, CheckSquare, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';

function StatCard({ icon, label, value, color, to }) {
  const inner = (
    <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12, borderColor: `rgba(${color},0.2)`, transition: 'transform 0.2s, border-color 0.2s', cursor: to ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(${color},0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `rgb(${color})` }}>
          {icon}
        </div>
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, lineHeight: 1, color: `rgb(${color})` }}>{value}</p>
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><Spinner size={32} /></div>;
  if (!data) return null;

  const statusMap = {};
  data.byStatus.forEach(s => statusMap[s.status] = s.count);
  const total = data.totalTasks || 1;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>Good {getGreeting()}, {user.name.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Here's what's happening across your projects.</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={<FolderKanban size={18} />} label="Projects" value={data.totalProjects} color="124,106,255" to="/projects" />
        <StatCard icon={<CheckSquare size={18} />} label="Total Tasks" value={data.totalTasks} color="56,189,248" to="/tasks" />
        <StatCard icon={<TrendingUp size={18} />} label="My Tasks" value={data.myTasks} color="34,211,160" to={`/tasks?assignee_id=${user.id}`} />
        <StatCard icon={<AlertTriangle size={18} />} label="Overdue" value={data.overdue} color="255,92,124" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Status breakdown */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 20 }}>Task Status</h3>
          {[
            { key: 'todo', label: 'To Do', color: 'var(--text-muted)' },
            { key: 'in_progress', label: 'In Progress', color: 'var(--blue)' },
            { key: 'review', label: 'In Review', color: 'var(--yellow)' },
            { key: 'done', label: 'Done', color: 'var(--green)' },
          ].map(({ key, label, color }) => {
            const count = statusMap[key] || 0;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{count}</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg)', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease', minWidth: count ? 4 : 0 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Priority breakdown */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 20 }}>By Priority</h3>
          {['urgent', 'high', 'medium', 'low'].map(p => {
            const item = data.byPriority.find(x => x.priority === p);
            const count = item?.count || 0;
            return (
              <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '8px 12px', background: 'var(--bg)', borderRadius: 8 }}>
                <PriorityBadge priority={p} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15 }}>Recent Activity</h3>
          <Link to="/tasks" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontSize: 13, textDecoration: 'none' }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {data.recentTasks.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No tasks yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.recentTasks.map(task => (
              <Link key={task.id} to={`/tasks/${task.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, background: 'var(--bg)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}>
                  <StatusBadge status={task.status} />
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>{task.title}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{task.project_name}</span>
                  {task.assignee_name && <Avatar name={task.assignee_name} color={task.assignee_color} size="sm" />}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
