import React, { useEffect, useRef } from 'react';

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

const SingleAdUnit = ({ slot, clientId }) => {
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
    <div className="w-full text-center overflow-hidden rounded-xl border border-white/5 bg-white/[0.015] p-2 min-h-[140px] flex items-center justify-center">
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
