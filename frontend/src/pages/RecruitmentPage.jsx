import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Briefcase, User, X, ChevronRight, UserCheck } from 'lucide-react';

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
const stageColors = {
  Applied: 'bg-slate-100 text-slate-600', Screening: 'bg-blue-100 text-blue-700',
  Interview: 'bg-violet-100 text-violet-700', Offer: 'bg-amber-100 text-amber-700',
  Hired: 'bg-emerald-100 text-emerald-700', Rejected: 'bg-red-100 text-red-700',
};

export default function RecruitmentPage() {
  const { user } = useAuth();
  const isHR = ['hr','admin','owner'].includes(user?.role_name);

  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showCandForm, setShowCandForm] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', department: '', description: '', vacancies: 1 });
  const [candForm, setCandForm] = useState({ job_id: '', full_name: '', email: '', phone: '', resume_url: '' });

  if (!isHR) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mb-4">
          <Briefcase size={28} className="text-violet-400" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A] mb-2">Access Restricted</h2>
        <p className="text-slate-500">Recruitment is managed by HR only.</p>
      </div>
    );
  }

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const [jRes, cRes] = await Promise.all([api.get('/recruitment/jobs'), api.get('/recruitment/candidates')]);
      setJobs(jRes.data.jobs || []);
      setCandidates(cRes.data.candidates || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await api.post('/recruitment/jobs', jobForm);
      toast.success('Job opening created!');
      setShowJobForm(false);
      setJobForm({ title: '', department: '', description: '', vacancies: 1 });
      const res = await api.get('/recruitment/jobs');
      setJobs(res.data.jobs || []);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/recruitment/candidates', { ...candForm, job_id: candForm.job_id || selectedJob?.id });
      toast.success('Candidate added!');
      setShowCandForm(false);
      setCandForm({ job_id: '', full_name: '', email: '', phone: '', resume_url: '' });
      const res = await api.get('/recruitment/candidates');
      setCandidates(res.data.candidates || []);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleStageChange = async (candidateId, stage) => {
    try {
      await api.put(`/recruitment/candidates/${candidateId}/stage`, { stage });
      toast.success('Stage updated!');
      const res = await api.get('/recruitment/candidates');
      setCandidates(res.data.candidates || []);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleHire = async (candidate) => {
    if (!confirm(`Hire ${candidate.full_name} as an employee?`)) return;
    try {
      await api.post(`/recruitment/candidates/${candidate.id}/hire`);
      toast.success(`${candidate.full_name} hired and employee profile created!`);
      init();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const filteredCandidates = selectedJob ? candidates.filter(c => c.job_id === selectedJob.id) : candidates;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Recruitment Pipeline</h2>
          <p className="text-sm text-slate-500">{jobs.length} open positions • {candidates.length} total candidates</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCandForm(!showCandForm)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded-xl">
            <User size={15} /> Add Candidate
          </button>
          <button onClick={() => setShowJobForm(!showJobForm)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#2563EB] rounded-xl">
            <Plus size={16} /> Post Job
          </button>
        </div>
      </div>

      {/* Job Form */}
      <AnimatePresence>
        {showJobForm && (
          <motion.form onSubmit={handleCreateJob} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-[#0F172A] mb-4">Post New Job Opening</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Job Title*</label>
                <input required value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} placeholder="e.g. Senior Developer"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Department</label>
                <input value={jobForm.department} onChange={e => setJobForm({...jobForm, department: e.target.value})} placeholder="e.g. Engineering"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Vacancies</label>
                <input type="number" min={1} value={jobForm.vacancies} onChange={e => setJobForm({...jobForm, vacancies: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
              </div>
              <div className="col-span-2 md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
                <textarea value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})} rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB] resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setShowJobForm(false)} className="px-4 py-2 text-sm bg-slate-100 text-slate-600 rounded-xl">Cancel</button>
              <button type="submit" className="px-6 py-2 text-sm font-semibold text-white bg-[#2563EB] rounded-xl">Post Job</button>
            </div>
          </motion.form>
        )}
        {showCandForm && (
          <motion.form onSubmit={handleCreateCandidate} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-[#0F172A] mb-4">Add Candidate</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Full Name*</label>
                <input required value={candForm.full_name} onChange={e => setCandForm({...candForm, full_name: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Email*</label>
                <input type="email" required value={candForm.email} onChange={e => setCandForm({...candForm, email: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone</label>
                <input value={candForm.phone} onChange={e => setCandForm({...candForm, phone: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Job Opening</label>
                <select value={candForm.job_id || selectedJob?.id || ''} onChange={e => setCandForm({...candForm, job_id: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]">
                  <option value="">General</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Resume URL</label>
                <input value={candForm.resume_url} onChange={e => setCandForm({...candForm, resume_url: e.target.value})} placeholder="https://..."
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setShowCandForm(false)} className="px-4 py-2 text-sm bg-slate-100 text-slate-600 rounded-xl">Cancel</button>
              <button type="submit" className="px-6 py-2 text-sm font-semibold text-white bg-[#2563EB] rounded-xl">Add Candidate</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-5">
        {/* Job Openings Panel */}
        <div className="col-span-1 space-y-3">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Job Openings</h3>
          {loading ? <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl"/>)}</div> :
            jobs.length === 0 ? <div className="text-center text-slate-400 text-sm py-8">No job postings yet</div> :
            jobs.map(job => (
              <button key={job.id} onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedJob?.id === job.id ? 'border-[#2563EB] bg-blue-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                <p className="font-semibold text-[#0F172A] text-sm">{job.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{job.department}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-400">{job.vacancies} vacanc{job.vacancies === 1 ? 'y' : 'ies'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${job.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{job.is_active ? 'Active' : 'Closed'}</span>
                </div>
              </button>
            ))
          }
        </div>

        {/* Candidates Panel */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
              {selectedJob ? `Candidates for ${selectedJob.title}` : 'All Candidates'}
            </h3>
            {selectedJob && <button onClick={() => setSelectedJob(null)} className="text-xs text-slate-500 hover:text-slate-700">Clear filter</button>}
          </div>
          {loading ? <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl"/>)}</div> :
            filteredCandidates.length === 0 ? <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">No candidates found</div> :
            filteredCandidates.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {c.full_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0F172A] text-sm truncate">{c.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">{c.email}</p>
                  {c.job_title && <p className="text-xs text-blue-600 mt-0.5">{c.job_title}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <select value={c.stage} onChange={e => handleStageChange(c.id, e.target.value)}
                    className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 outline-none cursor-pointer ${stageColors[c.stage]}`}>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {c.stage === 'Offer' && (
                    <button onClick={() => handleHire(c)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors">
                      <UserCheck size={13} /> Hire
                    </button>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
