import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tf_token');
    if (token) {
      api.me().then(({ user }) => {
        setUser(user);
      }).catch(() => {
        localStorage.removeItem('tf_token');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { token, user } = await api.login({ email, password });
    localStorage.setItem('tf_token', token);
    setUser(user);
  };

  const signup = async (name, email, password, role) => {
    const { token, user } = await api.signup({ name, email, password, role });
    localStorage.setItem('tf_token', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('tf_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
