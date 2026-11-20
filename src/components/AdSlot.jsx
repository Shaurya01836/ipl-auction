import React, { useState, useEffect, useRef } from 'react';

const DEFAULT_CLIENT_ID = 'ca-pub-2952599241278941';
const DEFAULT_LANDING_SLOT_1 = '6078587405';
const DEFAULT_LANDING_SLOT_2 = '2911895830';
const DEFAULT_LANDING_SLOT_3 = '2523068937';
export const DEFAULT_LANDING_MULTIPLEX_SLOT = '2357584801';
export const DEFAULT_AUCTION_ROOM_SLOT = '6494103537';
export const DEFAULT_AUCTION_ROOM_MOBILE_SLOT = '8939145929';
export const DEFAULT_SIDEBAR_ACTIVITY_SLOT = '2911895830';

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
  slot = import.meta.env.VITE_ADSENSE_AUCTION_ROOM_SLOT || DEFAULT_AUCTION_ROOM_SLOT,
  className = ''
}) => {
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || DEFAULT_CLIENT_ID;

  if (!slot || !clientId) {
    return null;
  }

  return (
    <div className={`w-full rounded-2xl border border-white/10 bg-[#0c0d10]/90 backdrop-blur-md overflow-hidden p-2.5 transition-all shadow-md ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 px-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
          Sponsored
        </span>
      </div>

      {/* Ad slot */}
      <div className="w-full flex items-center justify-center">
        <SingleAdUnit slot={slot} clientId={clientId} bare />
      </div>
    </div>
  );
};

export const AuctionMobileBannerAd = ({
  slot = import.meta.env.VITE_ADSENSE_AUCTION_ROOM_MOBILE_SLOT || DEFAULT_AUCTION_ROOM_MOBILE_SLOT,
  className = ''
}) => {
  const adRef = useRef(null);
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || DEFAULT_CLIENT_ID;

  useEffect(() => {
    if (!slot || !clientId) return;

    ensureAdSenseScript(clientId);

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
    <div className={`w-full flex justify-center items-center sm:hidden overflow-hidden ${className}`}>
      <div className="w-[320px] h-[50px] min-h-[50px] flex items-center justify-center overflow-hidden">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'inline-block', width: '320px', height: '50px' }}
          data-ad-client={clientId}
          data-ad-slot={slot}
        />
      </div>
    </div>
  );
};

export const AuctionSidebarActivityAd = ({
  slot = import.meta.env.VITE_ADSENSE_SIDEBAR_ACTIVITY_SLOT || import.meta.env.VITE_ADSENSE_LANDING_SLOT_2 || DEFAULT_SIDEBAR_ACTIVITY_SLOT,
  className = ''
}) => {
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || DEFAULT_CLIENT_ID;

  if (!slot || !clientId) return null;

  return (
    <div className={`w-full shrink-0 border-t border-white/10 bg-[#0c0d10]/95 backdrop-blur-md p-2.5 sm:p-3 overflow-hidden flex flex-col items-center ${className}`}>
      <div className="w-full flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/5 px-0.5">
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">
          Sponsored Link
        </span>
      </div>
      <div className="w-full flex items-center justify-center min-h-[250px] max-h-[280px] overflow-hidden">
        <SingleAdUnit slot={slot} clientId={clientId} bare />
      </div>
    </div>
  );
};

export const MultiplexAdSlot = ({
  slot = import.meta.env.VITE_ADSENSE_LANDING_MULTIPLEX_SLOT || DEFAULT_LANDING_MULTIPLEX_SLOT,
  className = '',
  label = 'Sponsored Links'
}) => {
  const adRef = useRef(null);
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || DEFAULT_CLIENT_ID;

  useEffect(() => {
    if (!slot || !clientId) return;

    ensureAdSenseScript(clientId);

    const timer = setTimeout(() => {
      if (!adRef.current) return;
      if (adRef.current.getAttribute('data-adsbygoogle-status')) return;
      if (adRef.current.children.length > 0) return;

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[MultiplexAdSlot] AdSense push error:', err);
        }
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [slot, clientId]);

  if (!slot || !clientId) return null;

  return (
    <section className={`relative z-10 w-full max-w-6xl mx-auto ${className}`} aria-label={label}>
      <div className="mb-3 flex items-center justify-center gap-3">
        <div className="h-px w-10 bg-white/10" />
        <span className="text-[8px] font-black uppercase tracking-[0.35em] text-gray-500">{label}</span>
        <div className="h-px w-10 bg-white/10" />
      </div>

      <div className="w-full text-center overflow-hidden rounded-2xl border border-white/5 bg-white/[0.015] p-2.5 sm:p-4 min-h-[140px] flex items-center justify-center">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-format="autorelaxed"
          data-ad-client={clientId}
          data-ad-slot={slot}
        />
      </div>
    </section>
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
