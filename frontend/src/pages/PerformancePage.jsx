import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Star, X, ChevronDown } from 'lucide-react';

const ratingColors = { 1: 'text-red-500', 2: 'text-orange-500', 3: 'text-amber-400', 4: 'text-blue-500', 5: 'text-emerald-500' };
const ratingLabels = { 1: 'Poor', 2: 'Below Average', 3: 'Average', 4: 'Good', 5: 'Excellent' };

export default function PerformancePage() {
  const { user, canManagePerformance } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [managerRating, setManagerRating] = useState(3);
  const [managerNotes, setManagerNotes] = useState('');
  const [selfRating, setSelfRating] = useState(3);
  const [selfComment, setSelfComment] = useState('');
  const [form, setForm] = useState({ employee_id: '', review_period: '', due_date: '', notes: '' });

  if (!canManagePerformance()) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
          <Star size={28} className="text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A] mb-2">Access Restricted</h2>
        <p className="text-slate-500">Performance Management is accessible by Admin and Manager only.</p>
      </div>
    );
  }

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const [rvRes, empRes] = await Promise.all([api.get('/performance'), api.get('/employees?limit=200')]);
      setReviews(rvRes.data.reviews || []);
      setEmployees(empRes.data.employees || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/performance', form);
      toast.success('Review cycle created!');
      setShowCreate(false);
      setForm({ employee_id: '', review_period: '', due_date: '', notes: '' });
      init();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleManagerReview = async () => {
    try {
      await api.put(`/performance/${reviewModal.id}/manager-review`, { manager_rating: managerRating, manager_notes: managerNotes });
      toast.success('Manager review submitted!');
      setReviewModal(null);
      init();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleSelfReview = async () => {
    try {
      await api.put(`/performance/${reviewModal.id}/submit`, { self_rating: selfRating, self_comment: selfComment });
      toast.success('Self review submitted!');
      setReviewModal(null);
      init();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const openReview = (r) => {
    setReviewModal(r);
    setManagerRating(r.manager_rating || 3);
    setManagerNotes(r.manager_notes || '');
    setSelfRating(r.self_rating || 3);
    setSelfComment(r.self_comment || '');
  };

  const getStatusBadge = (r) => {
    if (r.manager_rating && r.self_rating) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Completed</span>;
    if (r.self_rating) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Awaiting Manager</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Pending Self-Review</span>;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Performance Management</h2>
          <p className="text-sm text-slate-500">{reviews.length} review cycles</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#2563EB] rounded-xl">
          <Plus size={16} /> Create Review
        </button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.form onSubmit={handleCreate} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-[#0F172A] mb-4">New Review Cycle</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Employee*</label>
                <select required value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]">
                  <option value="">Select</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Review Period*</label>
                <input required placeholder="e.g. Q1 2025" value={form.review_period} onChange={e => setForm({...form, review_period: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
              </div>
              <div className="col-span-2 md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes</label>
                <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Objectives, goals..."
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm bg-slate-100 text-slate-600 rounded-xl">Cancel</button>
              <button type="submit" className="px-6 py-2 text-sm font-semibold text-white bg-[#2563EB] rounded-xl">Create</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Reviews Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full"/></div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center text-slate-400">No review cycles created yet</div>
      ) : (
        <div className="grid gap-4">
          {reviews.map(r => (
            <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center font-bold text-white text-sm">
                    {r.full_name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-[#0F172A]">{r.full_name}</p>
                    <p className="text-xs text-slate-500">{r.review_period} {r.due_date ? `• Due: ${new Date(r.due_date).toLocaleDateString('en-IN')}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(r)}
                  <button onClick={() => openReview(r)} className="text-xs text-[#2563EB] hover:underline font-medium">Review</button>
                </div>
              </div>
              {(r.self_rating || r.manager_rating) && (
                <div className="flex gap-6 mt-4 pt-4 border-t border-slate-50">
                  {r.self_rating && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Self Rating</p>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= r.self_rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />)}
                        <span className={`text-xs font-semibold ml-1 ${ratingColors[r.self_rating]}`}>{ratingLabels[r.self_rating]}</span>
                      </div>
                    </div>
                  )}
                  {r.manager_rating && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Manager Rating</p>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= r.manager_rating ? 'text-blue-400 fill-blue-400' : 'text-slate-200'} />)}
                        <span className={`text-xs font-semibold ml-1 ${ratingColors[r.manager_rating]}`}>{ratingLabels[r.manager_rating]}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {reviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">{reviewModal.full_name}</h3>
                  <p className="text-sm text-slate-500">{reviewModal.review_period}</p>
                </div>
                <button onClick={() => setReviewModal(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X size={18} /></button>
              </div>

              {/* Self Review */}
              <div className="mb-5 p-4 bg-amber-50 rounded-xl">
                <p className="text-sm font-semibold text-amber-800 mb-3">Self Review</p>
                <div className="flex gap-2 mb-3">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setSelfRating(s)} type="button"
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${s === selfRating ? 'bg-amber-400 text-white' : 'bg-white text-slate-500 hover:bg-amber-100'}`}>
                      {s}★
                    </button>
                  ))}
                </div>
                <textarea value={selfComment} onChange={e => setSelfComment(e.target.value)} rows={2} placeholder="Your self-assessment..."
                  className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg outline-none focus:border-amber-400 bg-white resize-none" />
                <button onClick={handleSelfReview} className="mt-2 px-4 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg">Submit Self Review</button>
              </div>

              {/* Manager Review */}
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm font-semibold text-blue-800 mb-3">Manager Review</p>
                <div className="flex gap-2 mb-3">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setManagerRating(s)} type="button"
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${s === managerRating ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 hover:bg-blue-100'}`}>
                      {s}★
                    </button>
                  ))}
                </div>
                <textarea value={managerNotes} onChange={e => setManagerNotes(e.target.value)} rows={2} placeholder="Manager assessment..."
                  className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg outline-none focus:border-blue-400 bg-white resize-none" />
                <button onClick={handleManagerReview} className="mt-2 px-4 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg">Submit Manager Review</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
