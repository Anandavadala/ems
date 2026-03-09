import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Download, Edit2, Trash2, X, ChevronLeft, ChevronRight, Eye, Save, GripVertical } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-amber-100 text-amber-700',
  exited: 'bg-slate-100 text-slate-600',
};

const initialForm = {
  full_name: '', email: '', phone: '', designation: '', date_of_birth: '',
  gender: '', address: '', city: '', state: '', country: 'India', pincode: '',
  emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: '',
  department_id: '', role_id: '', manager_id: '', location: '',
  date_of_joining: '', probation_end_date: '', employment_type: 'full-time', work_mode: 'office'
};

export default function EmployeesPage() {
  const { canManageEmployees, hasRole } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  // Resizable split
  const [leftWidth, setLeftWidth] = useState(380);
  const isDragging = useRef(false);
  const containerRef = useRef(null);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      setLeftWidth(Math.min(Math.max(newWidth, 260), 650));
    };
    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  useEffect(() => { fetchEmployees(); }, [search, filterDept, filterStatus, page]);
  useEffect(() => {
    api.get('/departments').then(r => setDepartments(r.data.departments || [])).catch(() => {});
    api.get('/roles').then(r => setRoles(r.data.roles || [])).catch(() => {});
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.append('search', search);
      if (filterDept) params.append('department', filterDept);
      if (filterStatus) params.append('status', filterStatus);
      const res = await api.get(`/employees?${params}`);
      const list = res.data.employees || [];
      setEmployees(list);
      setPagination(res.data.pagination || {});
      if (selectedEmployee) {
        const updated = list.find(e => e.id === selectedEmployee.id);
        if (updated) setSelectedEmployee(updated);
      }
    } catch { toast.error('Failed to fetch employees'); }
    finally { setLoading(false); }
  };

  const openEmployee = (emp, editMode = false) => {
    setSelectedEmployee(emp);
    setForm({ ...initialForm, ...emp });
    setIsEditing(editMode);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/employees', form);
      toast.success('Employee created!');
      setShowAddModal(false);
      setForm(initialForm);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating employee');
    } finally { setSubmitting(false); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/employees/${selectedEmployee.id}`, form);
      toast.success('Employee updated!');
      setIsEditing(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating employee');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success('Employee deleted');
      setSelectedEmployee(null);
      fetchEmployees();
    } catch { toast.error('Failed to delete'); }
  };

  const exportCSV = async () => {
    try {
      const res = await api.get('/employees/export/csv', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'employees.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  const panelOpen = !!selectedEmployee;
  // compact list only when split is open AND left panel is narrow
  const showCompact = panelOpen && leftWidth < 480;

  return (
    <div ref={containerRef} className="flex -m-6 select-none" style={{ height: 'calc(100vh - 64px)' }}>

      {/*  LEFT PANEL  */}
      <div className="flex flex-col bg-white border-r border-slate-200 flex-shrink-0"
        style={{ width: panelOpen ? leftWidth : '100%' }}>

        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-100 space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Employee Profiles</h2>
              <p className="text-xs text-slate-500">{pagination.total || 0} total employees</p>
            </div>
            <div className="flex gap-2">
              {!showCompact && (
                <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
                  <Download size={13} /> CSV
                </button>
              )}
              {canManageEmployees() && (
                <button onClick={() => { setForm(initialForm); setShowAddModal(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-xl hover:bg-blue-700 shadow-sm">
                  <Plus size={13} /> {showCompact ? '' : 'Add Employee'}
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#2563EB]" />
          </div>

          {!showCompact && (
            <div className="flex gap-2">
              <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setPage(1); }}
                className="flex-1 px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none">
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                className="flex-1 px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="exited">Exited</option>
              </select>
            </div>
          )}
        </div>

        {/* Employee list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-5 h-5 border-2 border-[#2563EB] border-t-transparent rounded-full" />
            </div>
          ) : employees.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-10">No employees found</p>
          ) : showCompact ? (
            /*  COMPACT LIST: ID + Name side by side (split mode, narrow)  */
            <div className="divide-y divide-slate-50">
              {/* Column headers */}
              <div className="flex items-center px-4 py-2 bg-slate-50 border-b border-slate-100 sticky top-0">
                <span className="text-xs font-semibold text-slate-400 w-24 flex-shrink-0">EMP ID</span>
                <span className="text-xs font-semibold text-slate-400">Name</span>
              </div>
              {employees.map(emp => (
                <button key={emp.id} onClick={() => openEmployee(emp)}
                  className={`w-full flex items-center gap-0 px-4 py-2.5 text-left hover:bg-blue-50/60 transition-colors
                    ${selectedEmployee?.id === emp.id ? 'bg-blue-50 border-l-2 border-[#2563EB]' : 'border-l-2 border-transparent'}`}>
                  {/* ID column */}
                  <span className={`font-mono text-xs w-24 flex-shrink-0 ${selectedEmployee?.id === emp.id ? 'text-[#2563EB] font-bold' : 'text-slate-400'}`}>
                    {emp.employee_id}
                  </span>
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold
                      ${selectedEmployee?.id === emp.id ? 'bg-[#2563EB]' : 'bg-slate-400'}`}>
                      {emp.full_name?.[0]}
                    </div>
                    <span className={`text-sm font-medium truncate ${selectedEmployee?.id === emp.id ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>
                      {emp.full_name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /*  FULL TABLE when no panel  */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {['Employee ID','Name','Department','Role','Manager','Type','Status','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 font-semibold text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employees.map(emp => (
                    <motion.tr key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                      onClick={() => openEmployee(emp)}>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{emp.employee_id}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-[#2563EB] to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{emp.full_name?.[0]}</span>
                          </div>
                          <div>
                            <p className="font-medium text-[#0F172A]">{emp.full_name}</p>
                            <p className="text-xs text-slate-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{emp.department_name || '—'}</td>
                      <td className="px-4 py-3.5 text-slate-600 capitalize">{emp.role_name || '—'}</td>
                      <td className="px-4 py-3.5 text-slate-600">{emp.manager_name || '—'}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 capitalize">{emp.employment_type}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[emp.status] || 'bg-slate-100 text-slate-600'}`}>{emp.status}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEmployee(emp)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={15} /></button>
                          {canManageEmployees() && emp.status !== 'exited' && (
                            <>
                              <button onClick={() => openEmployee(emp, true)} className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Edit2 size={15} /></button>
                              {hasRole('owner', 'admin') && (
                                <button onClick={() => handleDelete(emp.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white flex-shrink-0">
            <p className="text-xs text-slate-500">{(page-1)*20+1}–{Math.min(page*20,pagination.total)} of {pagination.total}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft size={14}/></button>
              {Array.from({length:Math.min(5,pagination.pages)},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setPage(p)} className={`w-7 h-7 rounded-lg text-xs font-medium ${page===p?'bg-[#2563EB] text-white':'text-slate-600 hover:bg-slate-100'}`}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(pagination.pages,p+1))} disabled={page===pagination.pages} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><ChevronRight size={14}/></button>
            </div>
          </div>
        )}
      </div>

      {/*  DRAG HANDLE  */}
      {panelOpen && (
        <div
          onMouseDown={onMouseDown}
          className="w-1.5 flex-shrink-0 bg-slate-200 hover:bg-[#2563EB] cursor-col-resize flex items-center justify-center group transition-colors z-10"
          title="Drag to resize">
          <GripVertical size={14} className="text-slate-400 group-hover:text-white transition-colors" />
        </div>
      )}

      {/*  RIGHT DETAIL PANEL  */}
      <AnimatePresence>
        {selectedEmployee && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col bg-white overflow-hidden min-w-0">

            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-[#2563EB] to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">{selectedEmployee.full_name?.[0]}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#0F172A] text-base truncate">{selectedEmployee.full_name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedEmployee.employee_id}</p>
                </div>
                <span className={`ml-1 flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[selectedEmployee.status]||'bg-slate-100 text-slate-600'}`}>
                  {selectedEmployee.status}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {canManageEmployees() && selectedEmployee.status !== 'exited' && !isEditing && (
                  <button onClick={() => { setForm({...initialForm,...selectedEmployee}); setIsEditing(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-xl hover:bg-blue-700">
                    <Edit2 size={13}/> Edit
                  </button>
                )}
                {hasRole('owner','admin') && selectedEmployee.status !== 'exited' && !isEditing && (
                  <button onClick={() => handleDelete(selectedEmployee.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100">
                    <Trash2 size={13}/> Delete
                  </button>
                )}
                <button onClick={() => { setSelectedEmployee(null); setIsEditing(false); }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={16}/>
                </button>
              </div>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="space-y-5 max-w-3xl">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Full Name*" value={form.full_name} onChange={e => setForm({...form,full_name:e.target.value})} required/>
                    <Field label="Email*" type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} required/>
                    <Field label="Phone" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})}/>
                    <Field label="Designation" value={form.designation} onChange={e => setForm({...form,designation:e.target.value})}/>
                    <Field label="Date of Birth" type="date" value={form.date_of_birth} onChange={e => setForm({...form,date_of_birth:e.target.value})}/>
                    <SelectField label="Gender" value={form.gender} onChange={e => setForm({...form,gender:e.target.value})} options={[['','Select'],['Male','Male'],['Female','Female'],['Other','Other']]}/>
                    <SelectField label="Department" value={form.department_id} onChange={e => setForm({...form,department_id:e.target.value})} options={[['','Select Department'],...departments.map(d=>[d.id,d.name])]}/>
                    <SelectField label="Role" value={form.role_id} onChange={e => setForm({...form,role_id:e.target.value})} options={[['','Select Role'],...roles.map(r=>[r.id,r.name])]}/>
                    <Field label="Date of Joining" type="date" value={form.date_of_joining} onChange={e => setForm({...form,date_of_joining:e.target.value})}/>
                    <Field label="Location" value={form.location} onChange={e => setForm({...form,location:e.target.value})}/>
                    <Field label="City" value={form.city} onChange={e => setForm({...form,city:e.target.value})}/>
                    <Field label="State" value={form.state} onChange={e => setForm({...form,state:e.target.value})}/>
                    <SelectField label="Employment Type" value={form.employment_type} onChange={e => setForm({...form,employment_type:e.target.value})} options={[['full-time','Full-Time'],['contract','Contract'],['intern','Intern']]}/>
                    <SelectField label="Work Mode" value={form.work_mode} onChange={e => setForm({...form,work_mode:e.target.value})} options={[['office','Office'],['remote','Remote'],['hybrid','Hybrid']]}/>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Emergency Contact</p>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Name" value={form.emergency_contact_name} onChange={e => setForm({...form,emergency_contact_name:e.target.value})}/>
                      <Field label="Phone" value={form.emergency_contact_phone} onChange={e => setForm({...form,emergency_contact_phone:e.target.value})}/>
                      <Field label="Relation" value={form.emergency_contact_relation} onChange={e => setForm({...form,emergency_contact_relation:e.target.value})}/>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={submitting}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl disabled:opacity-60">
                      <Save size={14}/> {submitting?'Saving...':'Save Changes'}
                    </button>
                    <button type="button" onClick={() => setIsEditing(false)}
                      className="px-5 py-2.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5 max-w-3xl">
                  {selectedEmployee.status === 'exited' && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Archived Employee</span>
                      <span className="ml-auto px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-bold rounded">EXITED</span>
                    </div>
                  )}
                  <Section title="Basic Information">
                    <InfoGrid items={[
                      ['Employee ID',selectedEmployee.employee_id],
                      ['Full Name',selectedEmployee.full_name],
                      ['Email',selectedEmployee.email],
                      ['Phone',selectedEmployee.phone],
                      ['Gender',selectedEmployee.gender],
                      ['Date of Birth',selectedEmployee.date_of_birth?new Date(selectedEmployee.date_of_birth).toLocaleDateString('en-IN'):'—'],
                    ]}/>
                  </Section>
                  <Section title="Work Information">
                    <InfoGrid items={[
                      ['Department',selectedEmployee.department_name],
                      ['Role',selectedEmployee.role_name],
                      ['Designation',selectedEmployee.designation],
                      ['Manager',selectedEmployee.manager_name],
                      ['Employment Type',selectedEmployee.employment_type],
                      ['Work Mode',selectedEmployee.work_mode],
                      ['Location',selectedEmployee.location],
                      ['Date of Joining',selectedEmployee.date_of_joining?new Date(selectedEmployee.date_of_joining).toLocaleDateString('en-IN'):'—'],
                    ]}/>
                  </Section>
                  <Section title="Address">
                    <InfoGrid items={[
                      ['City',selectedEmployee.city],
                      ['State',selectedEmployee.state],
                      ['Country',selectedEmployee.country],
                      ['Pincode',selectedEmployee.pincode],
                    ]}/>
                  </Section>
                  <Section title="Emergency Contact">
                    <InfoGrid items={[
                      ['Name',selectedEmployee.emergency_contact_name],
                      ['Phone',selectedEmployee.emergency_contact_phone],
                      ['Relation',selectedEmployee.emergency_contact_relation],
                    ]}/>
                  </Section>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAddModal && (
          <Modal title="Add New Employee" onClose={() => setShowAddModal(false)}>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name*" value={form.full_name} onChange={e => setForm({...form,full_name:e.target.value})} required/>
                <Field label="Email*" type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} required/>
                <Field label="Phone" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})}/>
                <Field label="Designation" value={form.designation} onChange={e => setForm({...form,designation:e.target.value})}/>
                <Field label="Date of Birth" type="date" value={form.date_of_birth} onChange={e => setForm({...form,date_of_birth:e.target.value})}/>
                <SelectField label="Gender" value={form.gender} onChange={e => setForm({...form,gender:e.target.value})} options={[['','Select'],['Male','Male'],['Female','Female'],['Other','Other']]}/>
                <SelectField label="Department" value={form.department_id} onChange={e => setForm({...form,department_id:e.target.value})} options={[['','Select Department'],...departments.map(d=>[d.id,d.name])]}/>
                <SelectField label="Role" value={form.role_id} onChange={e => setForm({...form,role_id:e.target.value})} options={[['','Select Role'],...roles.map(r=>[r.id,r.name])]}/>
                <Field label="Date of Joining" type="date" value={form.date_of_joining} onChange={e => setForm({...form,date_of_joining:e.target.value})}/>
                <Field label="Probation End Date" type="date" value={form.probation_end_date} onChange={e => setForm({...form,probation_end_date:e.target.value})}/>
                <SelectField label="Employment Type" value={form.employment_type} onChange={e => setForm({...form,employment_type:e.target.value})} options={[['full-time','Full-Time'],['contract','Contract'],['intern','Intern']]}/>
                <SelectField label="Work Mode" value={form.work_mode} onChange={e => setForm({...form,work_mode:e.target.value})} options={[['office','Office'],['remote','Remote'],['hybrid','Hybrid']]}/>
                <Field label="Location" value={form.location} onChange={e => setForm({...form,location:e.target.value})}/>
                <Field label="City" value={form.city} onChange={e => setForm({...form,city:e.target.value})}/>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Emergency Contact</p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Name" value={form.emergency_contact_name} onChange={e => setForm({...form,emergency_contact_name:e.target.value})}/>
                  <Field label="Phone" value={form.emergency_contact_phone} onChange={e => setForm({...form,emergency_contact_phone:e.target.value})}/>
                  <Field label="Relation" value={form.emergency_contact_relation} onChange={e => setForm({...form,emergency_contact_relation:e.target.value})}/>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl disabled:opacity-60">
                  {submitting?'Creating...':'Create Employee'}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">{title}</p>
      {children}
    </div>
  );
}

function InfoGrid({ items }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map(([label, value]) => (
        <div key={label} className="bg-slate-50 rounded-xl px-3.5 py-2.5">
          <p className="text-xs text-slate-400 mb-0.5">{label}</p>
          <p className="text-sm font-medium text-[#0F172A] capitalize">{value || '—'}</p>
        </div>
      ))}
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, required }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <input type={type} value={value || ''} onChange={onChange} required={required}
        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"/>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <select value={value || ''} onChange={onChange}
        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB] bg-white">
        {options.map(([val, text]) => <option key={val} value={val}>{text}</option>)}
      </select>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-[#0F172A]">{title}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"><X size={18}/></button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}
