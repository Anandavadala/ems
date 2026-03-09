import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { UserPlus, X, Edit2, ArrowLeftRight, Shield } from 'lucide-react';

const ROLE_COLORS = {
  owner: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', header: 'bg-purple-600' },
  admin: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', header: 'bg-blue-600' },
  hr: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', header: 'bg-emerald-600' },
  manager: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', header: 'bg-amber-600' },
  employee: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700', header: 'bg-slate-500' },
};

const ROLE_DESCRIPTIONS = {
  owner: 'Full system access. Can manage all roles, data, and settings.',
  admin: 'Broad administrative access. Can manage employees, roles, payroll.',
  hr: 'Human Resources. Manages recruitment, onboarding, leave, exit.',
  manager: 'Team manager. Approves leaves, manages team performance.',
  employee: 'Standard employee. Access to self-service features.',
};

export default function AccessControlPage() {
  const { canManageRoles, user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addInputs, setAddInputs] = useState({});
  const [moveModal, setMoveModal] = useState(null);
  const [moveRole, setMoveRole] = useState('');

  useEffect(() => { fetchRoles(); }, []);

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
      if (res.data.success) setRoles(res.data.roles);
    } catch { toast.error('Failed to fetch roles'); }
    finally { setLoading(false); }
  };

  if (!canManageRoles()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield size={32} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Access Restricted</h2>
          <p className="text-slate-500">Only <strong>Owner</strong> and <strong>Admin</strong> can manage roles and access control.</p>
          <p className="text-sm text-slate-400 mt-3">Your current role: <span className="font-semibold capitalize text-slate-600">{user?.role}</span></p>
        </motion.div>
      </div>
    );
  }

  const handleAssign = async (role) => {
    const username = addInputs[role]?.trim();
    if (!username) return toast.error('Enter a username or email');
    try {
      const res = await api.post('/roles/assign', { username, role });
      if (res.data.success) {
        toast.success(res.data.message);
        setAddInputs(prev => ({ ...prev, [role]: '' }));
        fetchRoles();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign role');
    }
  };

  const handleRemove = async (userId) => {
    try {
      await api.put('/roles/remove', { userId });
      toast.success('User moved to Employee role');
      fetchRoles();
    } catch { toast.error('Failed to remove'); }
  };

  const handleMove = async () => {
    if (!moveRole) return toast.error('Select a role');
    try {
      const res = await api.post('/roles/assign', { username: moveModal.email, role: moveRole });
      if (res.data.success) {
        toast.success(res.data.message);
        setMoveModal(null);
        fetchRoles();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to move');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full"/></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0F172A]">Access Control & Role Management</h2>
        <p className="text-sm text-slate-500 mt-1">Manage user roles and permissions across the organization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {roles.map(role => {
          const colors = ROLE_COLORS[role.name] || ROLE_COLORS.employee;
          return (
            <motion.div key={role.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-2xl border ${colors.border} shadow-sm overflow-hidden`}>
              {/* Card Header */}
              <div className={`${colors.header} px-5 py-4`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-lg capitalize">{role.name}</h3>
                  <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    {role.users?.length || 0} users
                  </span>
                </div>
                <p className="text-white/80 text-xs mt-1">{ROLE_DESCRIPTIONS[role.name]}</p>
              </div>

              <div className="p-4 space-y-4">
                {/* Add User */}
                <div className="flex gap-2">
                  <input
                    value={addInputs[role.name] || ''}
                    onChange={e => setAddInputs(prev => ({ ...prev, [role.name]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAssign(role.name)}
                    placeholder="Username or email..."
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                  />
                  <button onClick={() => handleAssign(role.name)}
                    className={`${colors.header} text-white px-3 py-2 rounded-lg hover:opacity-90 transition-opacity`}>
                    <UserPlus size={16} />
                  </button>
                </div>

                {/* User List */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {role.users?.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No users in this role</p>
                  ) : role.users?.map(u => (
                    <div key={u.id} className={`flex items-center gap-2.5 px-3 py-2.5 ${colors.bg} rounded-xl`}>
                      <div className={`w-7 h-7 ${colors.header} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-xs font-bold">{u.full_name?.[0] || u.username?.[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0F172A] truncate">{u.full_name}</p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => { setMoveModal(u); setMoveRole(''); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Move role">
                          <ArrowLeftRight size={13} />
                        </button>
                        {role.name !== 'employee' && (
                          <button onClick={() => handleRemove(u.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remove from role">
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Move Role Modal */}
      {moveModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-[#0F172A] mb-1">Move User Role</h3>
            <p className="text-sm text-slate-500 mb-4">Moving <strong>{moveModal.full_name}</strong> to a new role</p>
            <select value={moveRole} onChange={e => setMoveRole(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#2563EB] mb-4">
              <option value="">Select new role...</option>
              {roles.filter(r => r.name !== moveModal.role_name).map(r => (
                <option key={r.id} value={r.name}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setMoveModal(null)} className="flex-1 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleMove} className="flex-1 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl transition-colors">Move</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
