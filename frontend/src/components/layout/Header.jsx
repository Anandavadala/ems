import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search } from 'lucide-react';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employee Profiles',
  '/organization': 'Organization Structure',
  '/access-control': 'Access Control',
  '/attendance': 'Attendance & Time Tracking',
  '/leave': 'Leave Management',
  '/payroll': 'Payroll & Compensation',
  '/performance': 'Performance Management',
  '/recruitment': 'Recruitment & Onboarding',
  '/training': 'Training & Skill Management',
  '/assets': 'Asset & IT Management',
  '/self-service': 'Employee Self Service',
  '/exit': 'Exit & Offboarding',
};

export default function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const title = pageTitles[location.pathname] || 'Enterprise EMS';

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 flex-shrink-0 z-10">
      <div>
        <h1 className="text-lg font-bold text-[#0F172A]">{title}</h1>
        <p className="text-xs text-slate-400 capitalize">{user?.role} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Quick search..."
            className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl w-56 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        <button className="relative w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2563EB] rounded-full"></span>
        </button>
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-100">
          <div className="w-8 h-8 bg-gradient-to-br from-[#2563EB] to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">{user?.full_name?.[0] || 'U'}</span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-[#0F172A] leading-tight">{user?.full_name}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
