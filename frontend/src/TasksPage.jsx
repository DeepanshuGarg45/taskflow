import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { Spinner, StatusBadge, PriorityBadge, Avatar, formatDate, EmptyState } from './components';
import { Filter, AlertCircle } from 'lucide-react';

const STATUS_OPTIONS = ['', 'todo', 'in_progress', 'review', 'done'];
const PRIORITY_OPTIONS = ['', 'urgent', 'high', 'medium', 'low'];

export default function TasksPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const filters = {
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    project_id: searchParams.get('project_id') || '',
    assignee_id: searchParams.get('assignee_id') || '',
  };

  const setFilter = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    setSearchParams(p);
  };

  useEffect(() => {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    Promise.all([api.getTasks(params), api.getProjects()])
      .then(([t, p]) => { setTasks(t.tasks); setProjects(p.projects); })
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [searchParams.toString()]);

  const isOverdue = (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done';

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>All Tasks</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{tasks.length} task{tasks.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
          <Filter size={14} /> Filters
        </div>
        <select value={filters.status} onChange={e => setFilter('status', e.target.value)} style={{ width: 'auto', minWidth: 120 }}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <select value={filters.priority} onChange={e => setFilter('priority', e.target.value)} style={{ width: 'auto', minWidth: 120 }}>
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filters.project_id} onChange={e => setFilter('project_id', e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filters.assignee_id} onChange={e => setFilter('assignee_id', e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
          <option value="">All Assignees</option>
          <option value={user.id}>Assigned to me</option>
        </select>
        {Object.values(filters).some(v => v) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSearchParams({})}>Clear all</button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
      ) : tasks.length === 0 ? (
        <EmptyState icon="✅" title="No tasks found" subtitle="Try adjusting the filters or create a new task from a project." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                {['Task', 'Project', 'Status', 'Priority', 'Assignee', 'Due'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, i) => (
                <tr key={task.id} style={{ borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isOverdue(task) && <AlertCircle size={14} color="var(--red)" title="Overdue" />}
                      <Link to={`/tasks/${task.id}`} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 500, fontSize: 14 }}
                        onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                        onMouseLeave={e => e.target.style.color = 'var(--text-primary)'}>
                        {task.title}
                      </Link>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <Link to={`/projects/${task.project_id}`} style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}
                      onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                      onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
                      {task.project_name}
                    </Link>
                  </td>
                  <td style={{ padding: '13px 16px' }}><StatusBadge status={task.status} /></td>
                  <td style={{ padding: '13px 16px' }}><PriorityBadge priority={task.priority} /></td>
                  <td style={{ padding: '13px 16px' }}>
                    {task.assignee_name ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <Avatar name={task.assignee_name} color={task.assignee_color} size="sm" />
                        {task.assignee_name}
                      </div>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: 13, color: isOverdue(task) ? 'var(--red)' : 'var(--text-muted)' }}>
                      {formatDate(task.due_date) || '—'}
                    </span>
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
