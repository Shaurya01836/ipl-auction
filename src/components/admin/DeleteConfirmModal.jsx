import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RefreshCw } from 'lucide-react';

const DeleteConfirmModal = ({ deleteTarget, isDeleting, onConfirm, onCancel }) => {
  return (
    <AnimatePresence>
      {deleteTarget && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm sm:max-w-md bg-[#0c0d10] border border-white/10 rounded-[1.75rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.85)] space-y-5 sm:space-y-6 z-10 backdrop-blur-xl"
          >
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-pixel text-xs sm:text-sm uppercase tracking-tight text-white">
                Confirm Deletion
              </h3>
              <p className="text-xs text-slate-400 font-normal leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <span className="text-white font-semibold">"{deleteTarget.title}"</span>? This operation cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-xs hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase tracking-wider text-xs active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmModal;
