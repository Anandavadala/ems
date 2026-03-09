import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe();
  }, []);

  const fetchMe = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) setUser(res.data.user);
    return res.data;
  };

  const register = async (full_name, email, password) => {
    const res = await api.post('/auth/register', { full_name, email, password });
    if (res.data.success) setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  const hasRole = (...roles) => roles.includes(user?.role_name);
  const canManageRoles = () => hasRole('owner', 'admin');
  const canAccessPayroll = () => hasRole('owner', 'admin', 'hr');
  const canAccessExit = () => hasRole('owner', 'admin', 'hr');
  const canManageEmployees = () => hasRole('owner', 'admin', 'hr');
  const canApproveLeave = () => hasRole('owner', 'admin', 'hr', 'manager');
  const canManagePerformance = () => hasRole('owner', 'admin', 'hr', 'manager');

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole, canManageRoles, canAccessPayroll, canAccessExit, canManageEmployees, canApproveLeave, canManagePerformance, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
