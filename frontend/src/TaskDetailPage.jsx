import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { Spinner, StatusBadge, PriorityBadge, Avatar, Modal, formatDate } from './components';
import { ArrowLeft, Edit2, Trash2, MessageSquare, Send, Calendar, User, FolderKanban } from 'lucide-react';

export default function TaskDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const load = async () => {
    try {
      const { task, comments } = await api.getTask(id);
      setTask(task);
      setComments(comments);
      setEditForm({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assignee_id: task.assignee_id || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : ''
      });
      const proj = await api.getProject(task.project_id);
      setMembers(proj.members);
    } catch (err) {
      toast(err.message, 'error');
      navigate('/tasks');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await api.updateTask(id, { ...editForm, assignee_id: editForm.assignee_id || null, due_date: editForm.due_date || null });
      toast('Task updated!');
      setEditing(false);
      load();
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const submitComment = async () => {
    if (!comment.trim()) return;
    try {
      await api.addComment(id, { content: comment });
      setComment('');
      load();
    } catch (err) { toast(err.message, 'error'); }
  };

  const deleteTask = async () => {
    try {
      await api.deleteTask(id);
      toast('Task deleted');
      navigate('/tasks');
    } catch (err) { toast(err.message, 'error'); }
  };

  const quickStatusChange = async (status) => {
    try {
      await api.updateTask(id, { status });
      load();
    } catch (err) { toast(err.message, 'error'); }
  };

  if (loading) return <div className="loading-screen"><Spinner size={32} /></div>;
  if (!task) return null;

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  const canEdit = user.role === 'admin' || task.creator_id === user.id || task.assignee_id === user.id;

  return (
    <div className="fade-in" style={{ maxWidth: 800 }}>
      <Link to="/tasks" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 16, fontSize: 13 }}>
        <ArrowLeft size={14} /> All Tasks
      </Link>

      {/* Header */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            {editing ? (
              <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 700, padding: '6px 10px', marginBottom: 8 }} autoFocus />
            ) : (
              <h1 style={{ fontSize: 22, lineHeight: 1.3, marginBottom: 12 }}>{task.title}</h1>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {isOverdue && <span className="badge badge-urgent">⚠ Overdue</span>}
            </div>
          </div>
          {canEdit && (
            <div style={{ display: 'flex', gap: 6 }}>
              {editing ? (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                    {saving ? <Spinner size={12} /> : 'Save'}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}><Edit2 size={13} /> Edit</button>
                  {(user.role === 'admin' || task.creator_id === user.id) && (
                    <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}><Trash2 size={13} /></button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Quick Status */}
        {!editing && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Move to</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['todo', 'in_progress', 'review', 'done'].filter(s => s !== task.status).map(s => (
                <button key={s} className="btn btn-ghost btn-sm" onClick={() => quickStatusChange(s)}
                  style={{ fontSize: 12 }}>
                  {s === 'todo' ? 'To Do' : s === 'in_progress' ? 'In Progress' : s === 'review' ? 'Review' : 'Done'}
                </button>
              ))}
            </div>
          </div>
        )}

        {editing ? (
          <>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>Description</label>
              <textarea rows={4} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Assignee</label>
                <select value={editForm.assignee_id} onChange={e => setEditForm(f => ({ ...f, assignee_id: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={editForm.due_date} onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            {[
              { icon: FolderKanban, label: 'Project', value: task.project_name, to: `/projects/${task.project_id}` },
              { icon: User, label: 'Assignee', value: task.assignee_name || 'Unassigned', avatar: task.assignee_name ? { name: task.assignee_name, color: task.assignee_color } : null },
              { icon: User, label: 'Created by', value: task.creator_name },
              { icon: Calendar, label: 'Due Date', value: formatDate(task.due_date) || 'No date', overdue: isOverdue },
            ].map(({ icon: Icon, label, value, to, avatar, overdue }) => (
              <div key={label}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon size={11} /> {label}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {avatar && <Avatar name={avatar.name} color={avatar.color} size="sm" />}
                  {to ? (
                    <Link to={to} style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>{value}</Link>
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 500, color: overdue ? 'var(--red)' : 'var(--text-primary)' }}>{value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!editing && task.description && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{task.description}</p>
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="card">
        <h3 style={{ fontSize: 15, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={16} /> Comments <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 400 }}>({comments.length})</span>
        </h3>

        {comments.map(c => (
          <div key={c.id} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Avatar name={c.user_name} color={c.avatar_color} />
            <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{c.user_name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(c.created_at)}</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.content}</p>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>No comments yet. Be the first!</p>
        )}

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <Avatar name={user.name} color={user.avatar_color} />
          <div style={{ flex: 1 }}>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." rows={2} style={{ resize: 'none', marginBottom: 8 }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment(); }} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={submitComment} disabled={!comment.trim()}>
            <Send size={14} /> Send
          </button>
        </div>
      </div>

      {showDelete && (
        <Modal title="Delete Task" onClose={() => setShowDelete(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setShowDelete(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={deleteTask}>Delete Task</button>
          </>}>
          <p style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{task.title}</strong>?
          </p>
        </Modal>
      )}
    </div>
  );
}
