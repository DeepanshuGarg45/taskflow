# ⚡ TaskFlow — Team Task Manager

A full-stack team task management app with role-based access control, real-time dashboards, and project collaboration.

## 🚀 Live Demo
https://taskflow-production-d8ad.up.railway.app

## ✨ Features

### Authentication
- JWT-based signup / login
- Two roles: **Admin** (full access) and **Member** (project-scoped access)
- Persistent sessions with secure token storage

### Projects
- Create, update, and delete projects
- Add/remove team members per project
- Progress tracking (% complete)
- Admin sees all projects; Members see only their projects

### Tasks
- Create tasks with title, description, priority, status, assignee, and due date
- 4 statuses: `To Do` → `In Progress` → `Review` → `Done`
- 4 priority levels: `Low`, `Medium`, `High`, `Urgent`
- Quick status updates from task detail view
- Overdue detection & visual indicators

### Dashboard
- Summary stats: total projects, tasks, my tasks, overdue
- Status and priority breakdown charts
- Recent activity feed

### Comments
- Per-task threaded comments
- Keyboard shortcut: `Cmd/Ctrl + Enter` to submit

### Role-Based Access
| Feature | Admin | Member |
|---------|-------|--------|
| See all projects | ✅ | ❌ (own projects only) |
| Create projects | ✅ | ✅ |
| Delete any project | ✅ | ❌ (owner only) |
| Add project members | ✅ | ✅ (if project admin) |
| Create tasks | ✅ | ✅ (if project member) |
| Delete any task | ✅ | ❌ (creator only) |
| View users list | ✅ | ❌ |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Vite |
| Backend | Node.js, Express 4 |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Deployment | Railway |

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── routes/
│   │   ├── auth.js        # Signup, login, user listing
│   │   ├── projects.js    # Project CRUD + member mgmt
│   │   └── tasks.js       # Task CRUD + comments + dashboard
│   ├── db.js              # SQLite schema + connection
│   ├── middleware.js       # JWT auth + role checks
│   └── server.js          # Express app entry point
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Router + protected routes
│   │   ├── AuthPage.jsx         # Login / signup
│   │   ├── Layout.jsx           # Sidebar nav
│   │   ├── DashboardPage.jsx    # Stats + activity
│   │   ├── ProjectsPage.jsx     # Project list
│   │   ├── ProjectDetailPage.jsx # Project + member mgmt
│   │   ├── TasksPage.jsx        # Filterable task list
│   │   ├── TaskDetailPage.jsx   # Task view + comments
│   │   ├── UsersPage.jsx        # Admin: all users
│   │   ├── api.js               # API client
│   │   ├── AuthContext.jsx      # Auth state
│   │   └── ToastContext.jsx     # Toast notifications
│   └── index.html
├── railway.toml           # Railway deployment config
└── package.json           # Root build scripts
```

## 🚀 Deployment on Railway

### One-click deploy:
1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Select this repository
4. Add environment variables:
   ```
   JWT_SECRET=your-super-secret-key-here
   NODE_ENV=production
   PORT=3000
   ```
5. Click **Deploy** — Railway auto-detects `railway.toml`

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | ✅ | Secret for signing JWT tokens |
| `PORT` | Auto-set | Railway sets this automatically |
| `DB_PATH` | Optional | Custom SQLite file path |

## 🔧 Local Development

```bash
# Install all dependencies
npm run install:all

# Start backend (port 3001)
npm run dev:backend

# Start frontend (port 5173) — in another terminal
npm run dev:frontend
```

The frontend proxies `/api` requests to the backend automatically.

## 🔌 REST API Reference

### Auth
```
POST /api/auth/signup     { name, email, password, role }
POST /api/auth/login      { email, password }
GET  /api/auth/me         (requires token)
GET  /api/auth/users      (requires token)
```

### Projects
```
GET    /api/projects
POST   /api/projects      { name, description }
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/members    { user_id, role }
DELETE /api/projects/:id/members/:userId
```

### Tasks
```
GET    /api/tasks          ?project_id&status&priority&assignee_id
GET    /api/tasks/dashboard
POST   /api/tasks          { title, project_id, description, priority, status, assignee_id, due_date }
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
POST   /api/tasks/:id/comments  { content }
```

## 📝 License
MIT
