import React, { useEffect } from "react";
import { Trash2, X, Loader2 } from "lucide-react";

/**
 * Reusable confirmation dialog.
 *
 * Intentionally animation-free (no framer-motion) so it matches the
 * performance-focused landing page. Renders nothing when `isOpen` is false.
 *
 * @param {boolean}  isOpen        - Whether the dialog is visible.
 * @param {string}   title         - Bold heading.
 * @param {string}   description   - Supporting body copy.
 * @param {string}   detail        - Optional highlighted detail (e.g. "Room ABCD12").
 * @param {string}   confirmLabel  - Text for the confirm button.
 * @param {string}   cancelLabel   - Text for the cancel button.
 * @param {Function} onConfirm     - Called when the user confirms.
 * @param {Function} onCancel      - Called when the user cancels / dismisses.
 * @param {boolean}  loading       - Disables buttons and shows a spinner.
 */
const ConfirmDialog = ({
  isOpen,
  title = "Are you sure?",
  description,
  detail,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e) => {
      if (loading) return;
      // Only Escape is handled globally. Enter/Space are left to the focused
      // button so pressing Enter while Cancel is focused cannot confirm.
      if (e.key === "Escape") onCancel?.();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onCancel, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => !loading && onCancel?.()}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm bg-[#0c0c0c] border border-white/10 rounded-2xl p-5 shadow-[0_25px_60px_rgba(0,0,0,0.8)]"
      >
        <button
          type="button"
          onClick={() => !loading && onCancel?.()}
          aria-label="Close dialog"
          className="absolute top-3.5 right-3.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-11 h-11 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>

          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            {title}
          </h3>

          {description && (
            <p className="text-[11px] text-gray-400 font-medium mt-2 leading-relaxed">
              {description}
            </p>
          )}

          {detail && (
            <div className="mt-3 w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                {detail}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-5">
          <button
            type="button"
            autoFocus
            onClick={() => !loading && onCancel?.()}
            disabled={loading}
            className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => !loading && onConfirm?.()}
            disabled={loading}
            className="flex-1 h-10 rounded-xl bg-red-500/90 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
