const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware');

const router = express.Router();
router.use(authMiddleware);

// GET /api/projects
router.get('/', (req, res) => {
  const db = getDb();
  let projects;
  if (req.user.role === 'admin') {
    projects = db.prepare(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as done_count,
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count
      FROM projects p
      JOIN users u ON u.id = p.owner_id
      ORDER BY p.created_at DESC
    `).all();
  } else {
    projects = db.prepare(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as done_count,
        (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as member_count
      FROM projects p
      JOIN users u ON u.id = p.owner_id
      JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.id);
  }
  res.json({ projects });
});

// POST /api/projects
router.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });

  const db = getDb();
  const id = uuidv4();
  db.prepare(`INSERT INTO projects (id, name, description, owner_id) VALUES (?,?,?,?)`).run(id, name.trim(), description || null, req.user.id);
  // Auto-add creator as admin member
  db.prepare(`INSERT INTO project_members (project_id, user_id, role) VALUES (?,?,?)`).run(id, req.user.id, 'admin');

  const project = db.prepare(`
    SELECT p.*, u.name as owner_name FROM projects p JOIN users u ON u.id = p.owner_id WHERE p.id = ?
  `).get(id);
  res.status(201).json({ project });
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const project = db.prepare(`
    SELECT p.*, u.name as owner_name FROM projects p JOIN users u ON u.id = p.owner_id WHERE p.id = ?
  `).get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  // Access check
  if (req.user.role !== 'admin') {
    const membership = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member of this project' });
  }

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, u.role as system_role, u.avatar_color, pm.role as project_role, pm.joined_at
    FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = ?
  `).all(req.params.id);

  res.json({ project, members });
});

// PUT /api/projects/:id
router.put('/:id', (req, res) => {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const isOwner = project.owner_id === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Insufficient permissions' });

  const { name, description, status } = req.body;
  db.prepare(`UPDATE projects SET name=COALESCE(?,name), description=COALESCE(?,description), status=COALESCE(?,status) WHERE id=?`)
    .run(name || null, description || null, status || null, req.params.id);

  const updated = db.prepare(`SELECT p.*, u.name as owner_name FROM projects p JOIN users u ON u.id = p.owner_id WHERE p.id = ?`).get(req.params.id);
  res.json({ project: updated });
});

// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const isOwner = project.owner_id === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Insufficient permissions' });

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: 'Project deleted' });
});

// POST /api/projects/:id/members
router.post('/:id/members', (req, res) => {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const membership = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (req.user.role !== 'admin' && (!membership || membership.role !== 'admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { user_id, role } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const existing = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, user_id);
  if (existing) return res.status(409).json({ error: 'User already a member' });

  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?,?,?)').run(req.params.id, user_id, role || 'member');
  res.status(201).json({ message: 'Member added' });
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', (req, res) => {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const membership = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (req.user.role !== 'admin' && (!membership || membership.role !== 'admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (req.params.userId === project.owner_id) {
    return res.status(400).json({ error: 'Cannot remove project owner' });
  }

  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
  res.json({ message: 'Member removed' });
});

module.exports = router;
