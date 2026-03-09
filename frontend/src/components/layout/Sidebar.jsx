import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, GitBranch, Shield, Clock, CalendarDays,
  DollarSign, TrendingUp, UserPlus, GraduationCap, Monitor, User2,
  LogOut, ChevronLeft, ChevronRight, Building2, ArrowLeftRight
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Employee Profiles', path: '/employees', icon: Users },
  { label: 'Organization Structure', path: '/organization', icon: GitBranch },
  { label: 'Access Control', path: '/access-control', icon: Shield },
  { label: 'Attendance', path: '/attendance', icon: Clock },
  { label: 'Leave Management', path: '/leave', icon: CalendarDays },
  { label: 'Payroll', path: '/payroll', icon: DollarSign },
  { label: 'Performance Management', path: '/performance', icon: TrendingUp },
  { label: 'Recruitment & Onboarding', path: '/recruitment', icon: UserPlus },
  { label: 'Training & Skill Management', path: '/training', icon: GraduationCap },
  { label: 'Asset & IT Management', path: '/assets', icon: Monitor },
  { label: 'Employee Self Service', path: '/self-service', icon: User2 },
  { label: 'Exit & Offboarding', path: '/exit', icon: ArrowLeftRight },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-white border-r border-slate-100 shadow-sm z-20 flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center justify-center w-8 h-8 bg-[#0F172A] rounded-lg flex-shrink-0">
          <Building2 className="text-white" size={16} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-3 overflow-hidden whitespace-nowrap"
            >
              <p className="text-sm font-bold text-[#0F172A] leading-tight">Enterprise EMS</p>
              <p className="text-xs text-slate-400">Management System</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-20 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 hover:border-[#2563EB] transition-all z-30"
      >
        {collapsed ? <ChevronRight size={14} className="text-slate-600" /> : <ChevronLeft size={14} className="text-slate-600" />}
      </button>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative ${
                isActive
                  ? 'bg-blue-50 text-[#2563EB] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
            title={collapsed ? label : ''}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#2563EB] rounded-r-full"
                  />
                )}
                <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-[#2563EB]' : 'text-slate-500 group-hover:text-slate-700'}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm overflow-hidden whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-100 p-3 flex-shrink-0">
        <div className={`flex items-center gap-3 px-2 py-2 rounded-xl mb-1 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-[#2563EB] to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{user?.full_name?.[0] || 'U'}</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden min-w-0"
              >
                <p className="text-sm font-semibold text-[#0F172A] truncate">{user?.full_name}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 ${collapsed ? 'justify-center' : ''}`}
          title="Logout"
        >
          <LogOut size={18} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
