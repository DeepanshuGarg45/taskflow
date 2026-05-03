const BASE = '/api';

function getToken() {
  return localStorage.getItem('tf_token');
}

async function req(method, path, body) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  get: (path) => req('GET', path),
  post: (path, body) => req('POST', path, body),
  put: (path, body) => req('PUT', path, body),
  delete: (path) => req('DELETE', path),

  // Auth
  signup: (data) => req('POST', '/auth/signup', data),
  login: (data) => req('POST', '/auth/login', data),
  me: () => req('GET', '/auth/me'),
  users: () => req('GET', '/auth/users'),

  // Projects
  getProjects: () => req('GET', '/projects'),
  getProject: (id) => req('GET', `/projects/${id}`),
  createProject: (data) => req('POST', '/projects', data),
  updateProject: (id, data) => req('PUT', `/projects/${id}`, data),
  deleteProject: (id) => req('DELETE', `/projects/${id}`),
  addMember: (id, data) => req('POST', `/projects/${id}/members`, data),
  removeMember: (projectId, userId) => req('DELETE', `/projects/${projectId}/members/${userId}`),

  // Tasks
  getTasks: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return req('GET', `/tasks${q ? '?' + q : ''}`);
  },
  getDashboard: () => req('GET', '/tasks/dashboard'),
  getTask: (id) => req('GET', `/tasks/${id}`),
  createTask: (data) => req('POST', '/tasks', data),
  updateTask: (id, data) => req('PUT', `/tasks/${id}`, data),
  deleteTask: (id) => req('DELETE', `/tasks/${id}`),
  addComment: (id, data) => req('POST', `/tasks/${id}/comments`, data),
};
