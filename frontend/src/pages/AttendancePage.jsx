import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, XCircle, Calendar, Wifi, Building } from 'lucide-react';

const statusStyles = {
  present: 'bg-emerald-100 text-emerald-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-amber-100 text-amber-700',
  half_day: 'bg-orange-100 text-orange-700',
  wfh: 'bg-blue-100 text-blue-700',
  holiday: 'bg-purple-100 text-purple-700',
  weekend: 'bg-slate-100 text-slate-500',
};

export default function AttendancePage() {
  const { user, hasRole } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [myEmp, setMyEmp] = useState(null);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterEmpId, setFilterEmpId] = useState('');
  const [manualForm, setManualForm] = useState({ employee_id: '', date: new Date().toISOString().split('T')[0], status: 'present', punch_in: '', punch_out: '', wfh: false, notes: '' });
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const meRes = await api.get('/auth/me');
      if (meRes.data.user?.employee_db_id) {
        setMyEmp({ id: meRes.data.user.employee_db_id });
        const today = new Date().toISOString().split('T')[0];
        const attRes = await api.get(`/attendance?employee_id=${meRes.data.user.employee_db_id}&start_date=${today}&end_date=${today}`);
        if (attRes.data.attendance?.length > 0) setTodayRecord(attRes.data.attendance[0]);
      }
      if (hasRole('owner', 'admin', 'hr', 'manager')) {
        const empRes = await api.get('/employees?limit=200');
        setEmployees(empRes.data.employees || []);
      }
      await fetchAttendance();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchAttendance = async (empId) => {
    try {
      const params = new URLSearchParams({ limit: 30 });
      if (empId) params.append('employee_id', empId);
      const res = await api.get(`/attendance?${params}`);
      setAttendance(res.data.attendance || []);
    } catch {}
  };

  const handlePunchIn = async () => {
    if (!myEmp) return toast.error('Employee profile not found');
    try {
      const res = await api.post('/attendance/punch-in', { employee_id: myEmp.id });
      toast.success(res.data.late ? '⏰ Marked Late' : '✅ Punched In!');
      await init();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handlePunchOut = async () => {
    if (!myEmp) return toast.error('Employee profile not found');
    try {
      const res = await api.post('/attendance/punch-out', { employee_id: myEmp.id });
      toast.success(`✅ Punched Out! Hours: ${res.data.workHours}`);
      await init();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleManual = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/manual', manualForm);
      toast.success('Attendance recorded');
      setShowManual(false);
      fetchAttendance(filterEmpId);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full"/></div>;

  const canPunchIn = !todayRecord?.punch_in;
  const canPunchOut = todayRecord?.punch_in && !todayRecord?.punch_out;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-[#0F172A]">Attendance & Time Tracking</h2>

      {/* My Attendance Card */}
      {myEmp && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-base font-semibold text-[#0F172A] mb-4">Today's Attendance</h3>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-48">
              <p className="text-xs text-slate-500 mb-1">Date</p>
              <p className="font-semibold text-[#0F172A]">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            {todayRecord && (
              <>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Punch In</p>
                  <p className="font-bold text-emerald-600">{todayRecord.punch_in ? new Date(todayRecord.punch_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Punch Out</p>
                  <p className="font-bold text-red-500">{todayRecord.punch_out ? new Date(todayRecord.punch_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                </div>
                {todayRecord.work_hours && (
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">Work Hours</p>
                    <p className="font-bold text-[#2563EB]">{todayRecord.work_hours}h</p>
                  </div>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusStyles[todayRecord.status] || 'bg-slate-100 text-slate-600'}`}>
                  {todayRecord.status?.replace('_', ' ')}
                </span>
              </>
            )}
            <div className="flex gap-3 ml-auto">
              <button onClick={handlePunchIn} disabled={!canPunchIn}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <CheckCircle size={16} /> Punch In
              </button>
              <button onClick={handlePunchOut} disabled={!canPunchOut}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <XCircle size={16} /> Punch Out
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Manager/HR Controls */}
      {hasRole('owner', 'admin', 'hr', 'manager') && (
        <div className="flex flex-wrap gap-3 items-center">
          <select value={filterEmpId} onChange={e => { setFilterEmpId(e.target.value); fetchAttendance(e.target.value); }}
            className="px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-[#2563EB] min-w-48">
            <option value="">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>)}
          </select>
          <button onClick={() => setShowManual(!showManual)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#2563EB] rounded-xl hover:bg-blue-700 transition-colors">
            <Calendar size={16} /> Manual Entry
          </button>
        </div>
      )}

      {/* Manual Entry Form */}
      {showManual && (
        <motion.form onSubmit={handleManual} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-[#0F172A] mb-4">Manual Attendance Entry</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Employee*</label>
              <select required value={manualForm.employee_id} onChange={e => setManualForm({...manualForm, employee_id: e.target.value})}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]">
                <option value="">Select</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Date*</label>
              <input type="date" required value={manualForm.date} onChange={e => setManualForm({...manualForm, date: e.target.value})}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
              <select value={manualForm.status} onChange={e => setManualForm({...manualForm, status: e.target.value})}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]">
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half_day">Half Day</option>
                <option value="wfh">WFH</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Punch In Time</label>
              <input type="time" value={manualForm.punch_in} onChange={e => setManualForm({...manualForm, punch_in: e.target.value})}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Punch Out Time</label>
              <input type="time" value={manualForm.punch_out} onChange={e => setManualForm({...manualForm, punch_out: e.target.value})}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setShowManual(false)} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
            <button type="submit" className="px-6 py-2 text-sm font-semibold text-white bg-[#2563EB] rounded-xl">Save Entry</button>
          </div>
        </motion.form>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-[#0F172A]">Recent Attendance Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Employee</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Punch In</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Punch Out</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Hours</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {attendance.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">No attendance records found</td></tr>
              ) : attendance.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#0F172A]">{rec.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{new Date(rec.date).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-emerald-600 font-mono text-xs">{rec.punch_in ? new Date(rec.punch_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="px-4 py-3 text-red-500 font-mono text-xs">{rec.punch_out ? new Date(rec.punch_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="px-4 py-3 text-[#2563EB] font-semibold">{rec.work_hours ? `${rec.work_hours}h` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusStyles[rec.status] || 'bg-slate-100 text-slate-600'}`}>
                      {rec.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {rec.wfh ? <span className="flex items-center gap-1 text-blue-600 text-xs"><Wifi size={12} /> WFH</span>
                             : <span className="flex items-center gap-1 text-slate-500 text-xs"><Building size={12} /> Office</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
