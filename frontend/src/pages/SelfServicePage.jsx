import { motion } from 'framer-motion';
import { LayoutGrid, Wrench } from 'lucide-react';

export default function SelfServicePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-violet-50 rounded-3xl flex items-center justify-center mx-auto">
            <LayoutGrid size={52} className="text-purple-400" />
          </div>
          <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute -top-2 -right-2 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
            <Wrench size={18} className="text-white" />
          </motion.div>
        </div>
        <h2 className="text-2xl font-bold text-[#0F172A] mb-3">Employee Self-Service</h2>
        <p className="text-slate-500 mb-2">This module is currently under development.</p>
        <p className="text-sm text-slate-400">Profile updates, document downloads, and ticket submissions — coming soon.</p>
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </motion.div>
    </div>
  );
}
