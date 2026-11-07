import React, { useState } from 'react';
import { MessageSquarePlus, X, ArrowRight } from 'lucide-react';

const ServerNoticeBanner = ({ onTryHotspot, onOpenFeedback }) => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('dismissed_server_notice') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('dismissed_server_notice', 'true');
    } catch {
      // ignore
    }
  };

  if (dismissed) return null;

  return (
    <aside
      aria-label="Server notice and offline mode"
      className="w-full bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 text-gray-300 text-xs sticky top-0 z-50 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-2">
        {/* Mobile & Small Screen Layout (< md) */}
        <div className="flex flex-col gap-2 md:hidden">
          {/* Header row: Badge on left, Close button on right */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-white/10 text-gray-200 border border-white/15">
              <span>Notice</span>
            </span>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss banner"
              className="p-1 -mr-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Full message body */}
          <p className="text-gray-300 text-xs leading-relaxed">
            <span className="text-gray-400">Online auctions are temporarily paused. </span>
            You can play in <strong className="text-white font-medium">Offline Mode</strong> - Please share feedback or report any bugs you find!
          </p>

          {/* Equal-width action buttons */}
          <div className="flex items-center gap-2 pt-0.5">
            {onTryHotspot && (
              <button
                type="button"
                onClick={onTryHotspot}
                className="flex-1 py-1.5 px-3 rounded-full bg-white text-black hover:bg-gray-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span>Play Offline</span>
                <ArrowRight size={12} />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (onOpenFeedback) onOpenFeedback();
                else window.dispatchEvent(new CustomEvent('open-feedback-modal'));
              }}
              className="flex-1 py-1.5 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-200 hover:text-white font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <MessageSquarePlus size={12} className="text-gray-400" />
              <span>Feedback</span>
            </button>
          </div>
        </div>

        {/* Desktop Layout (>= md) */}
        <div className="hidden md:flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-white/10 text-gray-200 border border-white/15 shrink-0">
              <span>Notice</span>
            </span>

            <p className="text-gray-300 text-xs">
              <span className="text-gray-400">Online auctions are temporarily paused. </span>
              You can play in <strong className="text-white font-medium">Offline Mode</strong> - Please share feedback or report any bugs you find!
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onTryHotspot && (
              <button
                type="button"
                onClick={onTryHotspot}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-black hover:bg-gray-200 font-semibold text-[11px] transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
              >
                <span>Play Offline</span>
                <ArrowRight size={12} />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (onOpenFeedback) onOpenFeedback();
                else window.dispatchEvent(new CustomEvent('open-feedback-modal'));
              }}
              className="inline-flex items-center gap-1.5 text-[11px] text-gray-300 hover:text-white transition-colors cursor-pointer shrink-0 py-1 px-2.5 rounded-full hover:bg-white/5 border border-white/10 hover:border-white/20"
            >
              <MessageSquarePlus size={12} className="text-gray-400" />
              <span>Feedback</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss banner"
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ServerNoticeBanner;
