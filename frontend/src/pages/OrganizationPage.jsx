import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { GitBranch, Plus, ChevronRight, Users } from 'lucide-react';

export default function OrganizationPage() {
  const [departments, setDepartments] = useState([]);
  const [orgEmployees, setOrgEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('departments'); // departments | orgchart
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', parent_id: '', description: '' });

  useEffect(() => {
    Promise.all([
      api.get('/departments').then(r => setDepartments(r.data.departments || [])),
      api.get('/departments/org-chart').then(r => setOrgEmployees(r.data.employees || []))
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/departments', form);
      toast.success('Department created!');
      setShowForm(false);
      const res = await api.get('/departments');
      setDepartments(res.data.departments || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  // Build tree from employees
  const buildTree = (employees, parentId = null) => {
    return employees
      .filter(e => (e.manager_id === null ? parentId === null : parseInt(e.manager_id) === parentId))
      .map(e => ({ ...e, children: buildTree(employees, e.id) }));
  };

  const tree = buildTree(orgEmployees);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full"/></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Organization Structure</h2>
          <p className="text-sm text-slate-500">{departments.length} departments · {orgEmployees.length} employees</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1">
            {['departments', 'orgchart'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === v ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                {v === 'departments' ? 'Departments' : 'Org Chart'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] rounded-xl hover:bg-blue-700 transition-colors">
            <Plus size={16} /> Add Dept
          </button>
        </div>
      </div>

      {showForm && (
        <motion.form onSubmit={handleCreate} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Department Name*</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Parent Department</label>
              <select value={form.parent_id} onChange={e => setForm({...form, parent_id: e.target.value})}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]">
                <option value="">None (Top Level)</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
              <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 text-sm font-semibold text-white bg-[#2563EB] rounded-xl hover:bg-blue-700 transition-colors">Create</button>
          </div>
        </motion.form>
      )}

      {view === 'departments' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map(dept => (
            <motion.div key={dept.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <GitBranch size={20} className="text-[#2563EB]" />
                </div>
                <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">
                  <Users size={12} /> {dept.employee_count || 0}
                </span>
              </div>
              <h3 className="font-bold text-[#0F172A] text-base">{dept.name}</h3>
              {dept.parent_name && (
                <p className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <ChevronRight size={12} /> {dept.parent_name}
                </p>
              )}
              {dept.description && <p className="text-xs text-slate-500 mt-2">{dept.description}</p>}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-x-auto">
          <h3 className="text-base font-semibold text-[#0F172A] mb-5">Org Chart</h3>
          {tree.length === 0 ? (
            <p className="text-slate-400 text-center py-12">No employees found. Add employees with managers to view org chart.</p>
          ) : (
            <OrgTree nodes={tree} />
          )}
        </div>
      )}
    </div>
  );
}

function OrgTree({ nodes, depth = 0 }) {
  if (!nodes?.length) return null;
  return (
    <div className={`${depth > 0 ? 'pl-8 border-l-2 border-slate-100 ml-6 mt-3' : ''} space-y-3`}>
      {nodes.map(node => (
        <div key={node.id}>
          <div className="flex items-center gap-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl px-4 py-3 transition-colors">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2563EB] to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{node.full_name?.[0]}</span>
            </div>
            <div>
              <p className="font-semibold text-[#0F172A] text-sm">{node.full_name}</p>
              <p className="text-xs text-slate-500">{node.designation || node.role} · {node.department}</p>
            </div>
            <span className="ml-auto text-xs text-slate-400 font-mono">{node.employee_id}</span>
          </div>
          {node.children?.length > 0 && <OrgTree nodes={node.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
}
