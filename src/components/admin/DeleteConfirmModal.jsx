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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm sm:max-w-md bg-[#0c0c0c] border border-white/10 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6 z-10"
          >
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-white">
                Confirm Deletion
              </h3>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <span className="text-white font-bold">"{deleteTarget.title}"</span>? This operation cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-xs transition-all shadow-[0_4px_20px_rgba(239,68,68,0.3)] cursor-pointer flex items-center justify-center gap-2"
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
