import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { LogOut, X, CheckSquare, Square, AlertTriangle } from 'lucide-react';

const clearanceItems = ['it_access', 'finance', 'hr_docs', 'assets'];
const clearanceLabels = { it_access: 'IT Access Revoked', finance: 'Finance Clearance', hr_docs: 'HR Documents', assets: 'Assets Returned' };

export default function ExitPage() {
  const { user, canAccessExit } = useAuth();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form, setForm] = useState({ employee_id: '', resignation_date: '', last_working_day: '', reason: '' });

  if (!canAccessExit()) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <LogOut size={28} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A] mb-2">Access Restricted</h2>
        <p className="text-slate-500">Exit &amp; Offboarding is managed by Admin and HR only.</p>
      </div>
    );
  }

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const [exRes, empRes] = await Promise.all([api.get('/exit'), api.get('/employees?limit=200')]);
      setRecords(exRes.data.records || []);
      setEmployees(empRes.data.employees?.filter(e => e.status !== 'exited') || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleResign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/exit/resign', form);
      toast.success('Resignation submitted and offboarding started!');
      setShowForm(false);
      setForm({ employee_id: '', resignation_date: '', last_working_day: '', reason: '' });
      init();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleClearance = async (recordId, field, value) => {
    try {
      await api.put(`/exit/${recordId}/clearance`, { [field]: value });
      init();
    } catch (err) { toast.error('Error updating clearance'); }
  };

  const handleSettlement = async (recordId, data) => {
    try {
      await api.put(`/exit/${recordId}/settlement`, data);
      toast.success('Settlement updated!');
      setSelectedRecord(null);
      init();
    } catch (err) { toast.error('Error updating settlement'); }
  };

  const getStatusBadge = (r) => {
    if (r.status === 'completed') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">EXITED</span>;
    if (r.status === 'clearance') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Clearance Pending</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Resigned</span>;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Exit & Offboarding</h2>
          <p className="text-sm text-slate-500">{records.length} exit records</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors">
          <LogOut size={15} /> Initiate Exit
        </button>
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">Once exit is completed, the employee's data will be frozen and they will receive an <strong>EXITED</strong> status with an "Archived Employee" badge. This action cannot be undone.</p>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleResign} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm">
            <h3 className="font-semibold text-[#0F172A] mb-4">Initiate Resignation / Exit</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Employee*</label>
                <select required value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-red-400">
                  <option value="">Select</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Resignation Date*</label>
                <input type="date" required value={form.resignation_date} onChange={e => setForm({...form, resignation_date: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-red-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Last Working Day</label>
                <input type="date" value={form.last_working_day} onChange={e => setForm({...form, last_working_day: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-red-400" />
              </div>
              <div className="col-span-2 md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Reason</label>
                <textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-red-400 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm bg-slate-100 text-slate-600 rounded-xl">Cancel</button>
              <button type="submit" className="px-6 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl">Initiate Exit</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Records */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-red-400 border-t-transparent rounded-full"/></div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center text-slate-400">No exit records</div>
      ) : (
        <div className="space-y-4">
          {records.map(r => (
            <div key={r.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${r.status === 'completed' ? 'border-slate-200 opacity-75' : 'border-slate-100'}`}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-300 to-rose-400 flex items-center justify-center font-bold text-white">
                      {r.full_name?.[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0F172A]">{r.full_name}</span>
                        {r.status === 'completed' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-700 text-white rounded-full tracking-wide">ARCHIVED EMPLOYEE</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{r.employee_id} • {r.designation || r.department_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(r)}
                    {r.status !== 'completed' && (
                      <button onClick={() => setSelectedRecord(selectedRecord?.id === r.id ? null : r)}
                        className="text-xs text-[#2563EB] hover:underline font-medium">Settlement</button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-400 mb-0.5">Resigned On</p>
                    <p className="font-semibold">{r.resignation_date ? new Date(r.resignation_date).toLocaleDateString('en-IN') : '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-400 mb-0.5">Last Day</p>
                    <p className="font-semibold">{r.last_working_day ? new Date(r.last_working_day).toLocaleDateString('en-IN') : '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 col-span-2">
                    <p className="text-slate-400 mb-0.5">Reason</p>
                    <p className="font-medium text-slate-700">{r.reason || 'Not specified'}</p>
                  </div>
                </div>

                {/* Clearance Checklist */}
                <div className="border-t border-slate-50 pt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Clearance Checklist</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {clearanceItems.map(item => {
                      const done = r[item] === true || r[item] === 'true';
                      return (
                        <button key={item} onClick={() => r.status !== 'completed' && handleClearance(r.id, item, !done)} disabled={r.status === 'completed'}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-colors ${done ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'} ${r.status === 'completed' ? 'cursor-default' : 'cursor-pointer'}`}>
                          {done ? <CheckSquare size={14} className="text-emerald-500 flex-shrink-0" /> : <Square size={14} className="flex-shrink-0" />}
                          {clearanceLabels[item]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Settlement */}
                <AnimatePresence>
                  {selectedRecord?.id === r.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-50 mt-4 pt-4 overflow-hidden">
                      <SettlementForm record={r} onSave={handleSettlement} onClose={() => setSelectedRecord(null)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettlementForm({ record, onSave, onClose }) {
  const [data, setData] = useState({
    gratuity: record.gratuity || '',
    notice_pay: record.notice_pay || '',
    leave_encashment: record.leave_encashment || '',
    other_dues: record.other_dues || '',
    settlement_notes: record.settlement_notes || '',
  });
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Final Settlement</p>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X size={14} /></button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {[['gratuity','Gratuity (₹)'],['notice_pay','Notice Pay (₹)'],['leave_encashment','Leave Encashment (₹)'],['other_dues','Other Dues (₹)']].map(([k, label]) => (
          <div key={k}>
            <label className="block text-xs text-slate-500 mb-1">{label}</label>
            <input type="number" step="0.01" value={data[k]} onChange={e => setData({...data, [k]: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
          </div>
        ))}
      </div>
      <div className="mb-3">
        <label className="block text-xs text-slate-500 mb-1">Settlement Notes</label>
        <textarea value={data.settlement_notes} onChange={e => setData({...data, settlement_notes: e.target.value})} rows={2}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB] resize-none" />
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm bg-slate-100 text-slate-600 rounded-xl">Cancel</button>
        <button onClick={() => onSave(record.id, data)} className="px-6 py-2 text-sm font-semibold text-white bg-[#2563EB] rounded-xl">Save Settlement</button>
      </div>
    </div>
  );
}
