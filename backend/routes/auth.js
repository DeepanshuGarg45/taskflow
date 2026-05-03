const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { generateToken, authMiddleware } = require('../middleware');

const router = express.Router();

const AVATAR_COLORS = ['#6366f1','#ec4899','#14b8a6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#10b981'];

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const userRole = role === 'admin' ? 'admin' : 'member';

  db.prepare(`INSERT INTO users (id, name, email, password, role, avatar_color) VALUES (?,?,?,?,?,?)`)
    .run(id, name.trim(), email.toLowerCase(), hash, userRole, avatarColor);

  const user = db.prepare('SELECT id, name, email, role, avatar_color, created_at FROM users WHERE id = ?').get(id);
  const token = generateToken(id);
  res.status(201).json({ token, user });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { password: _, ...safeUser } = user;
  const token = generateToken(user.id);
  res.json({ token, user: safeUser });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// GET /api/auth/users  (admin: all users; member: project members)
router.get('/users', authMiddleware, (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, name, email, role, avatar_color, created_at FROM users ORDER BY name').all();
  res.json({ users });
});

module.exports = router;
