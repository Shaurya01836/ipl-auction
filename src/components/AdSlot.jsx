import React, { useState, useEffect, useRef } from 'react';
import { Minus, X } from 'lucide-react';

const DEFAULT_CLIENT_ID = 'ca-pub-2952599241278941';
const DEFAULT_LANDING_SLOT_1 = '6078587405';
const DEFAULT_LANDING_SLOT_2 = '2911895830';
const DEFAULT_LANDING_SLOT_3 = '2523068937';
export const DEFAULT_AUCTION_ROOM_SLOT = '6494103537';

const ensureAdSenseScript = (clientId) => {
  if (typeof document === 'undefined') return;
  if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
    const script = document.createElement('script');
    script.id = 'google-adsense-script';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    document.head.appendChild(script);
  }
};

export const SingleAdUnit = ({ slot, clientId, bare = false }) => {
  const adRef = useRef(null);

  useEffect(() => {
    if (!slot || !clientId) return;

    ensureAdSenseScript(clientId);

    // Delay push slightly so DOM layout completes and offsetWidth is non-zero
    const timer = setTimeout(() => {
      if (!adRef.current) return;
      if (adRef.current.getAttribute('data-adsbygoogle-status')) return;
      if (adRef.current.children.length > 0) return;

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[AdSlot] AdSense push error:', err);
        }
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [slot, clientId]);

  if (!slot || !clientId) return null;

  return (
    <div className={bare ? "w-full text-center overflow-hidden" : "w-full text-center overflow-hidden rounded-xl border border-white/5 bg-white/[0.015] p-2 min-h-[140px] flex items-center justify-center"}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export const AuctionRoomAd = ({
  roomId,
  slot = import.meta.env.VITE_ADSENSE_AUCTION_ROOM_SLOT || DEFAULT_AUCTION_ROOM_SLOT,
  className = ''
}) => {
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || DEFAULT_CLIENT_ID;
  const storageKey = roomId ? `dismissed_ad_${roomId}` : 'dismissed_ad_auction_room';

  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return typeof window !== 'undefined' && sessionStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });

  const [isMinimized, setIsMinimized] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(storageKey, '1');
      }
    } catch {}
  };

  if (isDismissed || !slot || !clientId) {
    return null;
  }

  if (isMinimized) {
    return (
      <div className={`w-full my-2 flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#0c0d10]/90 border border-white/10 text-gray-400 text-xs shadow-sm transition-all ${className}`}>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Ad minimized (tap to view)
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="text-[10px] font-semibold uppercase tracking-wider text-gray-300 hover:text-white px-2 py-0.5 rounded bg-white/5 border border-white/10 transition-colors"
          >
            Show
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
            title="Close ad"
            aria-label="Close ad"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-2xl border border-white/10 bg-[#0c0d10]/90 backdrop-blur-md overflow-hidden p-2.5 transition-all shadow-md ${className}`}>
      {/* Header bar with controls */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 px-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
          Sponsored
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-white px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            title="Minimize ad"
            aria-label="Minimize ad"
          >
            <Minus size={11} />
            <span>Minimize</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
            title="Close ad"
            aria-label="Close ad"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Ad slot */}
      <div className="w-full flex items-center justify-center">
        <SingleAdUnit slot={slot} clientId={clientId} bare />
      </div>
    </div>
  );
};

const AdSlot = ({
  slot,
  slot1 = import.meta.env.VITE_ADSENSE_LANDING_SLOT_1 || import.meta.env.VITE_ADSENSE_LANDING_FOOTER_SLOT || DEFAULT_LANDING_SLOT_1,
  slot2 = import.meta.env.VITE_ADSENSE_LANDING_SLOT_2 || DEFAULT_LANDING_SLOT_2,
  slot3 = import.meta.env.VITE_ADSENSE_LANDING_SLOT_3 || DEFAULT_LANDING_SLOT_3,
  className = '',
  label = 'Advertisement'
}) => {
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || DEFAULT_CLIENT_ID;

  // If a single slot prop is passed explicitly, only render that one
  const activeSlots = (
    slot
      ? [slot]
      : [slot1, slot2, slot3]
  ).filter((s) => Boolean(s && clientId));

  if (activeSlots.length === 0) {
    return null;
  }

  const gridClass =
    activeSlots.length >= 3
      ? 'grid-cols-1 md:grid-cols-3 max-w-6xl'
      : activeSlots.length === 2
      ? 'grid-cols-1 md:grid-cols-2 max-w-5xl'
      : 'grid-cols-1 max-w-xl';

  return (
    <section className={`relative z-10 w-full mx-auto ${className}`} aria-label={label}>
      <div className="mb-3 flex items-center justify-center gap-3">
        <div className="h-px w-10 bg-white/10" />
        <span className="text-[8px] font-black uppercase tracking-[0.35em] text-gray-500">{label}</span>
        <div className="h-px w-10 bg-white/10" />
      </div>

      <div className={`grid ${gridClass} gap-4 mx-auto`}>
        {activeSlots.map((adSlotId, index) => (
          <SingleAdUnit key={`${adSlotId}-${index}`} slot={adSlotId} clientId={clientId} />
        ))}
      </div>
    </section>
  );
};

export default AdSlot;
