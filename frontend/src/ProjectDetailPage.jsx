import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { Spinner, Modal, Avatar, StatusBadge, PriorityBadge, formatDate } from './components';
import { Plus, UserPlus, UserMinus, ArrowLeft, CheckSquare, Users } from 'lucide-react';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tasks');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignee_id: '', due_date: '', status: 'todo' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [proj, taskData, users] = await Promise.all([
        api.getProject(id),
        api.getTasks({ project_id: id }),
        api.users()
      ]);
      setProject(proj.project);
      setMembers(proj.members);
      setTasks(taskData.tasks);
      setAllUsers(users.users);
    } catch (err) {
      toast(err.message, 'error');
      navigate('/projects');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const canManage = user.role === 'admin' || project?.owner_id === user.id ||
    members.find(m => m.id === user.id)?.project_role === 'admin';

  const nonMembers = allUsers.filter(u => !members.find(m => m.id === u.id));

  const addMember = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      await api.addMember(id, { user_id: selectedUserId, role: 'member' });
      toast('Member added!');
      setShowAddMember(false);
      setSelectedUserId('');
      load();
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const removeMember = async (userId) => {
    try {
      await api.removeMember(id, userId);
      toast('Member removed');
      load();
    } catch (err) { toast(err.message, 'error'); }
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    setSaving(true);
    try {
      await api.createTask({ ...taskForm, project_id: id, assignee_id: taskForm.assignee_id || undefined });
      toast('Task created!');
      setShowCreateTask(false);
      setTaskForm({ title: '', description: '', priority: 'medium', assignee_id: '', due_date: '', status: 'todo' });
      load();
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading-screen"><Spinner size={32} /></div>;
  if (!project) return null;

  const statusGroups = { todo: [], in_progress: [], review: [], done: [] };
  tasks.forEach(t => statusGroups[t.status]?.push(t));

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 12, fontSize: 13 }}>
          <ArrowLeft size={14} /> Projects
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, marginBottom: 4 }}>{project.name}</h1>
            {project.description && <p style={{ color: 'var(--text-secondary)' }}>{project.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {canManage && (
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddMember(true)}>
                <UserPlus size={14} /> Add Member
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateTask(true)}>
              <Plus size={14} /> New Task
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total', count: tasks.length, color: 'var(--text-secondary)' },
          { label: 'In Progress', count: statusGroups.in_progress.length, color: 'var(--blue)' },
          { label: 'Done', count: statusGroups.done.length, color: 'var(--green)' },
          { label: 'Members', count: members.length, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ flex: 1, padding: '14px 18px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: s.color }}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[{ key: 'tasks', icon: CheckSquare, label: 'Tasks' }, { key: 'members', icon: Users, label: 'Members' }].map(({ key, icon: Icon, label }) => (
          <button key={key} className="btn" onClick={() => setTab(key)} style={{
            background: 'transparent', border: 'none', borderRadius: 0,
            color: tab === key ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
            paddingBottom: 12, gap: 6
          }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'tasks' && (
        <div>
          {tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
              <p>No tasks yet. Create the first one!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {tasks.map(task => (
                <Link key={task.id} to={`/tasks/${task.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ transition: 'all 0.15s', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <p style={{ fontWeight: 500, marginBottom: 10, fontSize: 14, color: 'var(--text-primary)' }}>{task.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {task.assignee_name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                          <Avatar name={task.assignee_name} color={task.assignee_color} size="sm" />
                          {task.assignee_name}
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Unassigned</span>}
                      {task.due_date && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(task.due_date)}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {members.map(m => (
            <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
              <Avatar name={m.name} color={m.avatar_color} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 500 }}>{m.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.email}</p>
              </div>
              <span className={`badge badge-${m.project_role}`}>{m.project_role}</span>
              {canManage && m.id !== project.owner_id && m.id !== user.id && (
                <button className="btn btn-icon btn-sm" onClick={() => removeMember(m.id)} title="Remove member">
                  <UserMinus size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <Modal title="Add Team Member" onClose={() => setShowAddMember(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setShowAddMember(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addMember} disabled={saving || !selectedUserId}>
              {saving ? <Spinner size={14} /> : 'Add Member'}
            </button>
          </>}>
          <div className="form-group">
            <label>Select User</label>
            <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
              <option value="">Choose a user...</option>
              {nonMembers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          {nonMembers.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>All registered users are already members.</p>}
        </Modal>
      )}

      {/* Create Task Modal */}
      {showCreateTask && (
        <Modal title="Create Task" onClose={() => setShowCreateTask(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setShowCreateTask(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={createTask} disabled={saving || !taskForm.title.trim()}>
              {saving ? <Spinner size={14} /> : <><Plus size={14} /> Create Task</>}
            </button>
          </>}>
          <div className="form-group">
            <label>Title *</label>
            <input placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={3} placeholder="Optional description" value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Assign To</label>
              <select value={taskForm.assignee_id} onChange={e => setTaskForm(f => ({ ...f, assignee_id: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
