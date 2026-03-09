import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Building2 } from 'lucide-react';

export default function AuthPage() {
  const [tab, setTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let result;
      if (tab === 'signin') {
        result = await login(form.email, form.password);
      } else {
        if (!form.full_name) return toast.error('Full name is required.');
        result = await register(form.full_name, form.email, form.password);
      }
      if (result.success) {
        toast.success(tab === 'signin' ? 'Welcome back!' : 'Account created!');
        navigate('/dashboard');
      } else {
        toast.error(result.message || 'Something went wrong.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full"
          style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, #0F172A 2px, transparent 0)', backgroundSize: '50px 50px' }} />
      </div>
      <div className="absolute top-10 left-10 w-64 h-64 bg-blue-100 rounded-full opacity-20 blur-3xl" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-100 rounded-full opacity-20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md mx-4 z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0F172A] rounded-2xl mb-4 shadow-lg">
            <Building2 className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Enterprise EMS</h1>
          <p className="text-slate-500 text-sm mt-1">Employee Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {['signin', 'signup'].map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setForm({ full_name: '', email: '', password: '' }); }}
                className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 ${
                  tab === t
                    ? 'text-[#2563EB] border-b-2 border-[#2563EB] bg-blue-50/40'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.form
                key={tab}
                initial={{ opacity: 0, x: tab === 'signin' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tab === 'signin' ? 20 : -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {tab === 'signup' && (
                  <InputField
                    label="Full Name"
                    name="full_name"
                    type="text"
                    placeholder="John Doe"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                  />
                )}
                <InputField
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-sm transition-all duration-200 outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-blue-100 bg-slate-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01, boxShadow: '0 8px 25px rgba(37,99,235,0.35)' }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-3.5 bg-[#2563EB] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {tab === 'signin' ? 'Signing In...' : 'Creating Account...'}
                    </span>
                  ) : (
                    tab === 'signin' ? 'Login' : 'Create Account'
                  )}
                </motion.button>
              </motion.form>
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Enterprise Employee Management System © {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}

function InputField({ label, name, type, placeholder, value, onChange, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all duration-200 outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-blue-100 bg-slate-50 focus:bg-white"
      />
    </div>
  );
}
