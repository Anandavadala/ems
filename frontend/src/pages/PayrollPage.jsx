import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { DollarSign, Play, X, Settings } from 'lucide-react';

const tabs = ['Payroll', 'Salary Structure'];

export default function PayrollPage() {
  const { user, canAccessPayroll } = useAuth();
  const [activeTab, setActiveTab] = useState('Payroll');
  const [payrolls, setPayrolls] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [ssForm, setSsForm] = useState({ employee_id: '', basic_salary: '', hra_percent: '40', allowances: '', variable_pay: '' });
  const [showSsForm, setShowSsForm] = useState(false);

  if (!canAccessPayroll()) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <DollarSign size={28} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A] mb-2">Access Restricted</h2>
        <p className="text-slate-500">Payroll is only accessible to Owner, Admin, and HR.</p>
      </div>
    );
  }

  useEffect(() => { init(); }, [month, year]);

  const init = async () => {
    setLoading(true);
    try {
      const [prRes, empRes] = await Promise.all([
        api.get(`/payroll?month=${month}&year=${year}`),
        api.get('/employees?limit=200'),
      ]);
      setPayrolls(prRes.data.payrolls || []);
      setEmployees(empRes.data.employees || []);
      const ssRes = await api.get('/payroll/salary-structure');
      setSalaryStructures(ssRes.data.structures || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleProcess = async () => {
    if (!confirm(`Process payroll for ${month}/${year}? This will generate payslips for all employees.`)) return;
    setProcessing(true);
    try {
      const res = await api.post('/payroll/process', { month, year });
      toast.success(res.data.message || 'Payroll processed!');
      init();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setProcessing(false); }
  };

  const handleSsSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payroll/salary-structure', ssForm);
      toast.success('Salary structure saved!');
      setShowSsForm(false);
      const ssRes = await api.get('/payroll/salary-structure');
      setSalaryStructures(ssRes.data.structures || []);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Payroll Management</h2>
          <p className="text-sm text-slate-500">{payrolls.length} payslips for {months[month-1]} {year}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === t ? 'bg-white text-[#0F172A] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t}</button>
        ))}
      </div>

      {activeTab === 'Payroll' && (
        <>
          {/* Filters + Process */}
          <div className="flex flex-wrap gap-3 items-center">
            <select value={month} onChange={e => setMonth(+e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#2563EB]">
              {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(+e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#2563EB]">
              {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={handleProcess} disabled={processing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl disabled:opacity-60 transition-colors">
              <Play size={14} /> {processing ? 'Processing...' : 'Process Payroll'}
            </button>
          </div>

          {/* Stats */}
          {payrolls.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Gross', value: '₹' + fmt(payrolls.reduce((a, b) => a + Number(b.gross_salary || 0), 0)) },
                { label: 'Total Net', value: '₹' + fmt(payrolls.reduce((a, b) => a + Number(b.net_salary || 0), 0)) },
                { label: 'Total Deductions', value: '₹' + fmt(payrolls.reduce((a, b) => a + Number(b.total_deductions || 0), 0)) },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                  <p className="text-xl font-bold text-[#0F172A]">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100">
                    {['Employee','Emp ID','Basic','HRA','Allowances','Gross','PF','ESI','TDS','Net'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={10} className="py-12 text-center"><div className="animate-spin w-6 h-6 border-3 border-[#2563EB] border-t-transparent rounded-full mx-auto"/></td></tr>
                  ) : payrolls.length === 0 ? (
                    <tr><td colSpan={10} className="py-12 text-center text-slate-400">No payroll records — click "Process Payroll" to generate</td></tr>
                  ) : payrolls.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-[#0F172A]">{p.full_name}</td>
                      <td className="px-4 py-3 text-slate-500">{p.employee_id}</td>
                      <td className="px-4 py-3">₹{fmt(p.basic_salary)}</td>
                      <td className="px-4 py-3">₹{fmt(p.hra)}</td>
                      <td className="px-4 py-3">₹{fmt(p.other_allowances)}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">₹{fmt(p.gross_salary)}</td>
                      <td className="px-4 py-3 text-red-500">₹{fmt(p.pf_deduction)}</td>
                      <td className="px-4 py-3 text-red-500">₹{fmt(p.esi_deduction)}</td>
                      <td className="px-4 py-3 text-red-500">₹{fmt(p.tds_deduction)}</td>
                      <td className="px-4 py-3 font-bold text-[#2563EB]">₹{fmt(p.net_salary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'Salary Structure' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{salaryStructures.length} structures configured</p>
            <button onClick={() => setShowSsForm(!showSsForm)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#2563EB] rounded-xl">
              <Settings size={15} /> Set Structure
            </button>
          </div>

          {showSsForm && (
            <motion.form onSubmit={handleSsSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Employee*</label>
                  <select required value={ssForm.employee_id} onChange={e => setSsForm({...ssForm, employee_id: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]">
                    <option value="">Select</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>)}
                  </select>
                </div>
                {[['basic_salary','Basic Salary*'],['hra_percent','HRA %'],['allowances','Other Allowances'],['variable_pay','Variable Pay']].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
                    <input type="number" step="0.01" value={ssForm[key]} onChange={e => setSsForm({...ssForm, [key]: e.target.value})}
                      required={key === 'basic_salary'}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowSsForm(false)} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-6 py-2 text-sm font-semibold text-white bg-[#2563EB] rounded-xl">Save Structure</button>
              </div>
            </motion.form>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100">
                    {['Employee','Emp ID','Basic','HRA %','Allowances','Variable','Gross'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {salaryStructures.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-400">No salary structures configured</td></tr>
                  ) : salaryStructures.map(ss => (
                    <tr key={ss.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-[#0F172A]">{ss.full_name}</td>
                      <td className="px-4 py-3 text-slate-500">{ss.employee_id}</td>
                      <td className="px-4 py-3">₹{fmt(ss.basic_salary)}</td>
                      <td className="px-4 py-3">{ss.hra_percent}%</td>
                      <td className="px-4 py-3">₹{fmt(ss.allowances)}</td>
                      <td className="px-4 py-3">₹{fmt(ss.variable_pay)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-700">₹{fmt(Number(ss.basic_salary||0)+Number(ss.basic_salary||0)*Number(ss.hra_percent||0)/100+Number(ss.allowances||0)+Number(ss.variable_pay||0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
