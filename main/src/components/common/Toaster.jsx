import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '../../hooks/useApp';

export default function Toaster() {
  const { toasts } = useApp();
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium shadow-lg">
            {t.type === 'error' ? <XCircle size={18} className="text-red-600" /> : <CheckCircle2 size={18} className="text-emerald-600" />}{t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
