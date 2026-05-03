import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { Spinner, Modal, EmptyState } from './components';
import { Plus, FolderKanban, Trash2, Settings, Users, CheckSquare } from 'lucide-react';

function ProjectCard({ project, onDelete, isAdmin }) {
  const progress = project.task_count > 0 ? Math.round((project.done_count / project.task_count) * 100) : 0;
  return (
    <div className="card fade-in" style={{ transition: 'transform 0.2s, border-color 0.2s', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
      
      {/* Progress bar top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--border)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent), var(--green))', transition: 'width 0.8s ease' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
            <h3 style={{ fontSize: 17, marginBottom: 4, color: 'var(--text-primary)', transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = 'var(--accent)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-primary)'}>
              {project.name}
            </h3>
          </Link>
          {project.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{project.description}</p>}
        </div>
        {(isAdmin || project.is_owner) && (
          <button className="btn btn-icon btn-sm" onClick={() => onDelete(project)} style={{ flexShrink: 0 }}>
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 13 }}>
          <CheckSquare size={13} /> {project.task_count} tasks
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 13 }}>
          <Users size={13} /> {project.member_count} members
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {progress}% complete
        </div>
        <Link to={`/projects/${project.id}`} className="btn btn-ghost btn-sm">
          <Settings size={13} /> Manage
        </Link>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.getProjects().then(d => setProjects(d.projects)).catch(e => toast(e.message, 'error')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const createProject = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.createProject(form);
      toast('Project created!');
      setShowCreate(false);
      setForm({ name: '', description: '' });
      load();
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const deleteProject = async () => {
    try {
      await api.deleteProject(deleteTarget.id);
      toast('Project deleted');
      setDeleteTarget(null);
      load();
    } catch (err) { toast(err.message, 'error'); }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Projects</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
      ) : projects.length === 0 ? (
        <EmptyState icon="🚀" title="No projects yet" subtitle="Create your first project to get started"
          action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Create Project</button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onDelete={setDeleteTarget} isAdmin={user.role === 'admin'} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="New Project" onClose={() => setShowCreate(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={createProject} disabled={saving || !form.name.trim()}>
              {saving ? <Spinner size={14} /> : <><Plus size={14} /> Create</>}
            </button>
          </>}>
          <div className="form-group">
            <label>Project Name *</label>
            <input placeholder="e.g. Website Redesign" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea placeholder="What's this project about?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <Modal title="Delete Project" onClose={() => setDeleteTarget(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={deleteProject}>Delete Project</button>
          </>}>
          <p style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.name}</strong>? This will also delete all tasks in this project.
          </p>
        </Modal>
      )}
    </div>
  );
}
