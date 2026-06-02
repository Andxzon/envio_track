// ============================================================================
// EnvioTrack — Toast Notification System
// ============================================================================
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, Undo2, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const icons = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
  error: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  undo: <Undo2 className="w-5 h-5 text-amber-500 shrink-0" />,
};

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="glass rounded-2xl px-4 py-3 flex items-center gap-3 pointer-events-auto shadow-lg"
          >
            {icons[toast.type]}
            <span className="text-sm font-medium flex-1 text-foreground">
              {toast.message}
            </span>
            {toast.action && toast.actionLabel && (
              <button
                onClick={() => {
                  toast.action?.();
                  removeToast(toast.id);
                }}
                className="text-xs font-bold text-accent hover:text-accent-hover transition-colors shrink-0"
              >
                {toast.actionLabel}
              </button>
            )}
            <button
              onClick={() => removeToast(toast.id)}
              className="text-muted hover:text-foreground transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
