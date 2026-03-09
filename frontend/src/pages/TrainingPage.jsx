import { motion } from 'framer-motion';
import { BookOpen, Wrench } from 'lucide-react';

export default function TrainingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-amber-50 rounded-3xl flex items-center justify-center mx-auto">
            <BookOpen size={52} className="text-orange-400" />
          </div>
          <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute -top-2 -right-2 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
            <Wrench size={18} className="text-white" />
          </motion.div>
        </div>
        <h2 className="text-2xl font-bold text-[#0F172A] mb-3">Training & Development</h2>
        <p className="text-slate-500 mb-2">This module is currently under development.</p>
        <p className="text-sm text-slate-400">Track courses, certifications, and employee skill growth — coming soon.</p>
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </motion.div>
    </div>
  );
}
