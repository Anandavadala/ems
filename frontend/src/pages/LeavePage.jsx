import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, CheckCircle, XCircle, Clock, X } from 'lucide-react';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

export default function LeavePage() {
  const { user, canApproveLeave } = useAuth();
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [myEmp, setMyEmp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id: '', leave_type_id: '', start_date: '', end_date: '', reason: '' });
  const [approveModal, setApproveModal] = useState(null);
  const [approveNotes, setApproveNotes] = useState('');

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const [meRes, ltRes] = await Promise.all([api.get('/auth/me'), api.get('/leave/types')]);
      setLeaveTypes(ltRes.data.leaveTypes || []);
      if (meRes.data.user?.employee_db_id) {
        setMyEmp({ id: meRes.data.user.employee_db_id });
        setForm(f => ({ ...f, employee_id: meRes.data.user.employee_db_id }));
      }
      if (canApproveLeave()) {
        const empRes = await api.get('/employees?limit=200');
        setEmployees(empRes.data.employees || []);
      }
      await fetchRequests();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/leave/requests');
      setRequests(res.data.requests || []);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leave/request', form);
      toast.success('Leave request submitted!');
      setShowForm(false);
      setForm(f => ({ ...f, leave_type_id: '', start_date: '', end_date: '', reason: '' }));
      fetchRequests();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleApprove = async (status) => {
    try {
      await api.put(`/leave/requests/${approveModal.id}/approve`, { status, notes: approveNotes });
      toast.success(`Leave ${status}!`);
      setApproveModal(null);
      fetchRequests();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full"/></div>;

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Leave Management</h2>
          <p className="text-sm text-slate-500">{pendingCount} pending requests</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#2563EB] rounded-xl hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Apply Leave
        </button>
      </div>

      {/* Leave Type Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {leaveTypes.map(lt => (
          <div key={lt.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
            <p className="text-lg font-bold text-[#2563EB]">{lt.max_days_per_year}</p>
            <p className="text-xs text-slate-500 mt-0.5">{lt.code}</p>
            <p className="text-xs text-slate-400 truncate">{lt.name}</p>
          </div>
        ))}
      </div>

      {/* Apply Leave Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-[#0F172A] mb-4">Apply for Leave</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {canApproveLeave() && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Employee</label>
                  <select value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]">
                    <option value="">Select Employee</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Leave Type*</label>
                <select required value={form.leave_type_id} onChange={e => setForm({...form, leave_type_id: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]">
                  <option value="">Select</option>
                  {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name} ({lt.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">From Date*</label>
                <input type="date" required value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">To Date*</label>
                <input type="date" required value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Reason</label>
                <input value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="Brief reason..."
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
              <button type="submit" className="px-6 py-2 text-sm font-semibold text-white bg-[#2563EB] rounded-xl">Submit Request</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-[#0F172A]">Leave Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Employee</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">From</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">To</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Days</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                {canApproveLeave() && <th className="text-left px-4 py-3 font-semibold text-slate-600">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {requests.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">No leave requests found</td></tr>
              ) : requests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-[#0F172A]">{req.full_name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{req.code}</span></td>
                  <td className="px-4 py-3 text-slate-600">{new Date(req.start_date).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-slate-600">{new Date(req.end_date).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 font-semibold text-[#0F172A]">{req.days_requested}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[req.status]}`}>{req.status}</span>
                  </td>
                  {canApproveLeave() && (
                    <td className="px-4 py-3">
                      {req.status === 'pending' && (
                        <button onClick={() => { setApproveModal(req); setApproveNotes(''); }}
                          className="flex items-center gap-1 text-xs text-[#2563EB] hover:underline">
                          <Clock size={13} /> Review
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Modal */}
      <AnimatePresence>
        {approveModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0F172A]">Review Leave Request</h3>
                <button onClick={() => setApproveModal(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X size={18} /></button>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between"><span className="text-slate-500">Employee</span><span className="font-semibold">{approveModal.full_name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Leave Type</span><span className="font-semibold">{approveModal.leave_type_name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Duration</span><span className="font-semibold">{approveModal.days_requested} day(s)</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Dates</span><span className="font-semibold">{new Date(approveModal.start_date).toLocaleDateString('en-IN')} – {new Date(approveModal.end_date).toLocaleDateString('en-IN')}</span></div>
                  {approveModal.reason && <div className="flex justify-between"><span className="text-slate-500">Reason</span><span className="font-semibold">{approveModal.reason}</span></div>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes (optional)</label>
                <textarea value={approveNotes} onChange={e => setApproveNotes(e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#2563EB] resize-none" />
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => handleApprove('rejected')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                  <XCircle size={16} /> Reject
                </button>
                <button onClick={() => handleApprove('approved')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors">
                  <CheckCircle size={16} /> Approve
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
