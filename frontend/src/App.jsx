import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ToastProvider } from './ToastContext';
import Layout from './Layout';
import AuthPage from './AuthPage';
import DashboardPage from './DashboardPage';
import ProjectsPage from './ProjectsPage';
import ProjectDetailPage from './ProjectDetailPage';
import TasksPage from './TasksPage';
import TaskDetailPage from './TaskDetailPage';
import UsersPage from './UsersPage';
import { Spinner } from './components';

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="loading-screen">
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, var(--accent), #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 8px 32px var(--accent-glow)', marginBottom: 16 }}>⚡</div>
      <Spinner size={24} />
    </div>
  );

  if (!user) return <AuthPage />;

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ProtectedRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
