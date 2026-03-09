import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, UserCheck, CalendarX, DollarSign, UserPlus, Monitor } from 'lucide-react';
import api from '../utils/api';

const cardConfig = [
  { key: 'totalEmployees', label: 'Total Employees', icon: Users, color: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600' },
  { key: 'presentToday', label: 'Present Today', icon: UserCheck, color: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600' },
  { key: 'pendingLeaves', label: 'Pending Leaves', icon: CalendarX, color: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600' },
  { key: 'payrollThisMonth', label: 'Payroll This Month', icon: DollarSign, color: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-600', format: 'currency' },
  { key: 'recruitmentPipeline', label: 'Recruitment Pipeline', icon: UserPlus, color: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-600' },
  { key: 'assetsIssued', label: 'Assets Issued', icon: Monitor, color: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-600' },
];

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#F43F5E', '#84CC16'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function DashboardPage() {
  const [stats, setStats] = useState({});
  const [charts, setCharts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/employees/stats/dashboard').then(res => {
      if (res.data.success) {
        setStats(res.data.stats);
        setCharts(res.data.charts);
      }
    }).catch(() => {
      // Use demo data if API fails
      setStats({ totalEmployees: 0, presentToday: 0, pendingLeaves: 0, payrollThisMonth: 0, recruitmentPipeline: 0, assetsIssued: 0 });
      setCharts({ attendanceTrend: [], departmentDistribution: [], leaveStats: [] });
    }).finally(() => setLoading(false));
  }, []);

  const formatValue = (key, value) => {
    if (key === 'payrollThisMonth') return `₹${Number(value || 0).toLocaleString('en-IN')}`;
    return value ?? 0;
  };

  const leaveData = (charts.leaveStats || []).map(l => ({
    name: l.status?.charAt(0).toUpperCase() + l.status?.slice(1),
    value: parseInt(l.count)
  }));

  const attendanceData = (charts.attendanceTrend || []).map(a => ({
    date: new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    Present: parseInt(a.present)
  }));

  const deptData = (charts.departmentDistribution || []).map(d => ({
    name: d.name,
    Employees: parseInt(d.count)
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cardConfig.map(({ key, label, icon: Icon, light, text }) => (
          <motion.div key={key} variants={itemVariants} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${light} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={text} />
            </div>
            <p className="text-2xl font-bold text-[#0F172A]">{formatValue(key, stats[key])}</p>
            <p className="text-xs text-slate-500 mt-1 leading-tight">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Attendance Trend */}
        <motion.div variants={itemVariants} className="xl:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-base font-semibold text-[#0F172A] mb-4">Attendance Trend (Last 7 Days)</h2>
          {attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                <Area type="monotone" dataKey="Present" stroke="#2563EB" strokeWidth={2.5} fill="url(#attendanceGrad)" dot={{ fill: '#2563EB', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No attendance data yet" />
          )}
        </motion.div>

        {/* Leave Stats */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-base font-semibold text-[#0F172A] mb-4">Leave Statistics</h2>
          {leaveData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={leaveData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {leaveData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No leave data yet" />
          )}
        </motion.div>
      </div>

      {/* Department Distribution */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="text-base font-semibold text-[#0F172A] mb-4">Department Employee Distribution</h2>
        {deptData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
              <Bar dataKey="Employees" radius={[6, 6, 0, 0]}>
                {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No department data yet" />
        )}
      </motion.div>
    </motion.div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="h-[220px] flex flex-col items-center justify-center text-slate-300">
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
        </svg>
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
