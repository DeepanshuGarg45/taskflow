const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware');

const router = express.Router();
router.use(authMiddleware);

function checkProjectAccess(db, projectId, userId, userRole) {
  if (userRole === 'admin') return true;
  const membership = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, userId);
  return !!membership;
}

// GET /api/tasks?project_id=&status=&assignee_id=&priority=
router.get('/', (req, res) => {
  const db = getDb();
  const { project_id, status, assignee_id, priority } = req.query;

  let query = `
    SELECT t.*, 
      u.name as assignee_name, u.avatar_color as assignee_color,
      c.name as creator_name,
      p.name as project_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    JOIN users c ON c.id = t.creator_id
    JOIN projects p ON p.id = t.project_id
  `;

  const conditions = [];
  const params = [];

  if (req.user.role !== 'admin') {
    conditions.push(`t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)`);
    params.push(req.user.id);
  }

  if (project_id) { conditions.push('t.project_id = ?'); params.push(project_id); }
  if (status) { conditions.push('t.status = ?'); params.push(status); }
  if (assignee_id) { conditions.push('t.assignee_id = ?'); params.push(assignee_id); }
  if (priority) { conditions.push('t.priority = ?'); params.push(priority); }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY t.created_at DESC';

  const tasks = db.prepare(query).all(...params);
  res.json({ tasks });
});

// GET /api/tasks/dashboard
router.get('/dashboard', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  const projectFilter = isAdmin ? '' : `AND t.project_id IN (SELECT project_id FROM project_members WHERE user_id = '${userId}')`;

  const totalTasks = db.prepare(`SELECT COUNT(*) as count FROM tasks t WHERE 1=1 ${projectFilter}`).get().count;
  const myTasks = db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ?`).get(userId).count;
  const overdue = db.prepare(`SELECT COUNT(*) as count FROM tasks t WHERE t.due_date < date('now') AND t.status != 'done' ${projectFilter}`).get().count;

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM tasks t WHERE 1=1 ${projectFilter} GROUP BY status
  `).all();

  const byPriority = db.prepare(`
    SELECT priority, COUNT(*) as count FROM tasks t WHERE 1=1 ${projectFilter} GROUP BY priority
  `).all();

  const recentTasks = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color, p.name as project_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    JOIN projects p ON p.id = t.project_id
    WHERE 1=1 ${projectFilter}
    ORDER BY t.updated_at DESC LIMIT 5
  `).all();

  const totalProjects = isAdmin
    ? db.prepare(`SELECT COUNT(*) as count FROM projects`).get().count
    : db.prepare(`SELECT COUNT(*) as count FROM project_members WHERE user_id = ?`).get(userId).count;

  res.json({ totalTasks, myTasks, overdue, byStatus, byPriority, recentTasks, totalProjects });
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { title, description, project_id, assignee_id, priority, due_date, status } = req.body;
  if (!title || !project_id) return res.status(400).json({ error: 'Title and project_id required' });

  const db = getDb();
  if (!checkProjectAccess(db, project_id, req.user.id, req.user.role)) {
    return res.status(403).json({ error: 'Not a member of this project' });
  }

  const id = uuidv4();
  db.prepare(`INSERT INTO tasks (id, title, description, project_id, assignee_id, creator_id, priority, due_date, status)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(
    id, title.trim(), description || null, project_id,
    assignee_id || null, req.user.id,
    priority || 'medium', due_date || null, status || 'todo'
  );

  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color, c.name as creator_name, p.name as project_name
    FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id JOIN users c ON c.id = t.creator_id JOIN projects p ON p.id = t.project_id
    WHERE t.id = ?
  `).get(id);
  res.status(201).json({ task });
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color, c.name as creator_name, p.name as project_name
    FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id JOIN users c ON c.id = t.creator_id JOIN projects p ON p.id = t.project_id
    WHERE t.id = ?
  `).get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (!checkProjectAccess(db, task.project_id, req.user.id, req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const comments = db.prepare(`
    SELECT cm.*, u.name as user_name, u.avatar_color FROM comments cm JOIN users u ON u.id = cm.user_id WHERE cm.task_id = ? ORDER BY cm.created_at ASC
  `).all(req.params.id);

  res.json({ task, comments });
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (!checkProjectAccess(db, task.project_id, req.user.id, req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { title, description, status, priority, assignee_id, due_date } = req.body;
  db.prepare(`UPDATE tasks SET
    title=COALESCE(?,title),
    description=COALESCE(?,description),
    status=COALESCE(?,status),
    priority=COALESCE(?,priority),
    assignee_id=CASE WHEN ? IS NOT NULL THEN ? ELSE assignee_id END,
    due_date=CASE WHEN ? IS NOT NULL THEN ? ELSE due_date END,
    updated_at=datetime('now')
    WHERE id=?`).run(
    title || null, description || null, status || null, priority || null,
    assignee_id, assignee_id, due_date, due_date, req.params.id
  );

  const updated = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color, c.name as creator_name, p.name as project_name
    FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id JOIN users c ON c.id = t.creator_id JOIN projects p ON p.id = t.project_id
    WHERE t.id = ?
  `).get(req.params.id);
  res.json({ task: updated });
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (!checkProjectAccess(db, task.project_id, req.user.id, req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const isCreator = task.creator_id === req.user.id;
  if (!isCreator && req.user.role !== 'admin') return res.status(403).json({ error: 'Only creator or admin can delete' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Task deleted' });
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });

  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (!checkProjectAccess(db, task.project_id, req.user.id, req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const id = uuidv4();
  db.prepare('INSERT INTO comments (id, task_id, user_id, content) VALUES (?,?,?,?)').run(id, req.params.id, req.user.id, content);
  const comment = db.prepare(`SELECT cm.*, u.name as user_name, u.avatar_color FROM comments cm JOIN users u ON u.id = cm.user_id WHERE cm.id = ?`).get(id);
  res.status(201).json({ comment });
});

module.exports = router;
