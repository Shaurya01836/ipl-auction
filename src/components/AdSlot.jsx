import React, { useState, useEffect, useRef } from 'react';
import { detectAdBlocker, isAdScriptBlocked, markAdScriptBlocked } from '../lib/adBlockDetect';

const DEFAULT_CLIENT_ID = 'ca-pub-2952599241278941';
const DEFAULT_LANDING_SLOT_1 = '6078587405';
const DEFAULT_LANDING_SLOT_2 = '2911895830';
export const DEFAULT_LANDING_MULTIPLEX_SLOT = '6078587405';
export const DEFAULT_AUCTION_ROOM_SLOT = '6494103537';
export const DEFAULT_AUCTION_ROOM_MOBILE_SLOT = '8939145929';
export const DEFAULT_SIDEBAR_ACTIVITY_SLOT = '2911895830';
export const DEFAULT_TEAMS_AD_SLOT = '1476385035';

const ensureAdSenseScript = (clientId, onBlocked) => {
  if (typeof document === 'undefined') return;
  let script = document.querySelector('script[src*="adsbygoogle.js"]');
  if (!script) {
    script = document.createElement('script');
    script.id = 'google-adsense-script';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    document.head.appendChild(script);
  }
  script.addEventListener(
    'error',
    () => {
      markAdScriptBlocked();
      onBlocked?.();
    },
    { once: true }
  );
};

const AdBlockedNotice = ({ compact = false }) => (
  <div
    className={`w-full bg-[#0c0d10] border border-white/10 text-center shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] ${
      compact ? 'rounded-xl px-3 py-2.5' : 'rounded-[1.5rem] px-5 py-6'
    }`}
  >
    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 font-pixel text-[8px] uppercase tracking-wider mb-2">
      Ad Blocker Detected
    </div>
    <p
      className={`font-pixel uppercase tracking-tight text-white ${
        compact ? 'text-[10px]' : 'text-xs sm:text-sm'
      }`}
    >
      Please turn off your ad blocker
    </p>
    <p
      className={`text-slate-400 font-sans leading-relaxed mt-1 ${
        compact ? 'text-[10px]' : 'text-xs'
      }`}
    >
      Disable your ad blocker for this site to keep CrickAuction 100% free.
    </p>
  </div>
);

/**
 * Mounts <ins class="adsbygoogle"> imperatively inside a React-owned div so
 * ad blockers removing the <ins> node cannot cause React NotFoundError crashes.
 */
const AdIns = ({
  slot,
  clientId,
  refreshKey = 0,
  adRef,
  style = { display: 'block', width: '100%' },
  format = 'auto',
  responsive = 'true',
}) => {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = '';

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    Object.assign(ins.style, style);
    ins.setAttribute('data-ad-client', clientId);
    ins.setAttribute('data-ad-slot', slot);
    if (format) ins.setAttribute('data-ad-format', format);
    if (responsive) ins.setAttribute('data-full-width-responsive', responsive);

    host.appendChild(ins);
    adRef.current = ins;

    return () => {
      adRef.current = null;
      host.innerHTML = '';
    };
  }, [slot, clientId, refreshKey, format, responsive]);

  return <div ref={hostRef} className="w-full" />;
};

/**
 * Shared AdSense lifecycle hook:
 * - Pushes ads only once layout width > 0 (retries via ResizeObserver + IntersectionObserver so hidden/animating tabs never get stuck uninitialized)
 * - Hides unfilled slots via MutationObserver
 * - Supports policy-compliant in-viewport auto-refresh
 */
const useAdSenseSlot = ({
  slot,
  clientId,
  autoRefresh = false,
  refreshIntervalSec = 60,
  rootMargin = '0px',
  label = 'AdSlot',
}) => {
  const containerRef = useRef(null);
  const adRef = useRef(null);
  const pushedRef = useRef(false);
  const [isUnfilled, setIsUnfilled] = useState(false);
  const [isAdBlocked, setIsAdBlocked] = useState(() => isAdScriptBlocked() || detectAdBlocker());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setIsUnfilled(false);
    pushedRef.current = false;
  }, [slot, clientId, refreshKey]);

  useEffect(() => {
    const el = adRef.current;
    if (!el || isUnfilled || isAdBlocked) return;

    const checkStatus = () => {
      if (el.getAttribute('data-ad-status') === 'unfilled') {
        setIsUnfilled(true);
      }
    };

    checkStatus();

    const observer = new MutationObserver(checkStatus);
    observer.observe(el, { attributes: true, attributeFilter: ['data-ad-status'] });
    return () => observer.disconnect();
  }, [slot, clientId, refreshKey, isUnfilled, isAdBlocked]);

  useEffect(() => {
    if (!slot || !clientId || isUnfilled || isAdBlocked) return;

    ensureAdSenseScript(clientId, () => setIsAdBlocked(true));

    const tryPush = () => {
      if (isAdScriptBlocked() || detectAdBlocker()) {
        setIsAdBlocked(true);
        return;
      }
      if (pushedRef.current) return;
      const el = adRef.current;
      if (!el) return;
      if (el.getAttribute('data-adsbygoogle-status') || el.children.length > 0) {
        pushedRef.current = true;
        return;
      }
      if (el.offsetWidth < 100) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 100) return;
      const computed = window.getComputedStyle(el);
      if (computed.display === 'none' || computed.visibility === 'hidden') return;

      try {
        pushedRef.current = true;
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        pushedRef.current = false;
        if (import.meta.env.DEV) {
          console.warn(`[${label}] AdSense push error:`, err);
        }
      }
    };

    const t1 = setTimeout(tryPush, 120);
    const t2 = setTimeout(tryPush, 600);

    let io;
    if (typeof IntersectionObserver !== 'undefined' && containerRef.current) {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && entry.boundingClientRect.width > 0) {
              tryPush();
            }
          }
        },
        { rootMargin }
      );
      io.observe(containerRef.current);
    }

    let ro;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => tryPush());
      ro.observe(containerRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (io) io.disconnect();
      if (ro) ro.disconnect();
    };
  }, [slot, clientId, refreshKey, isUnfilled, isAdBlocked, rootMargin, label]);

  useEffect(() => {
    if (!autoRefresh || isAdBlocked) return;

    const intervalMs = Math.max(30, refreshIntervalSec) * 1000;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0 && rect.width > 0;
        if (!isInViewport) return;
      }
      setRefreshKey((k) => k + 1);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshIntervalSec, isAdBlocked]);

  return { containerRef, adRef, isUnfilled, isAdBlocked, refreshKey };
};

export const SingleAdUnit = ({
  slot,
  clientId,
  bare = false,
  autoRefresh = false,
  refreshIntervalSec = 60
}) => {
  const { containerRef, adRef, isUnfilled, isAdBlocked, refreshKey } = useAdSenseSlot({
    slot,
    clientId,
    autoRefresh,
    refreshIntervalSec,
    label: 'AdSlot',
  });

  if (!slot || !clientId || isUnfilled) return null;
  if (isAdBlocked) {
    return (
      <div ref={containerRef} className="w-full">
        <AdBlockedNotice compact={bare} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={bare ? "w-full text-center overflow-hidden" : "w-full text-center overflow-hidden rounded-xl border border-white/5 bg-white/[0.015] p-2 min-h-[140px] flex items-center justify-center"}
    >
      <AdIns slot={slot} clientId={clientId} refreshKey={refreshKey} adRef={adRef} />
    </div>
  );
};

export const AuctionRoomAd = ({
  slot = import.meta.env.VITE_ADSENSE_AUCTION_ROOM_SLOT || DEFAULT_AUCTION_ROOM_SLOT,
  className = '',
  autoRefresh = true,
  refreshIntervalSec = 60
}) => {
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || DEFAULT_CLIENT_ID;

  if (!slot || !clientId) {
    return null;
  }

  return (
    <div className={`w-full block text-center ${className}`}>
      <SingleAdUnit
        slot={slot}
        clientId={clientId}
        bare
        autoRefresh={autoRefresh}
        refreshIntervalSec={refreshIntervalSec}
      />
    </div>
  );
};

export const AuctionMobileBannerAd = ({
  slot = import.meta.env.VITE_ADSENSE_AUCTION_ROOM_MOBILE_SLOT || DEFAULT_AUCTION_ROOM_MOBILE_SLOT,
  className = '',
  autoRefresh = true,
  refreshIntervalSec = 60
}) => {
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || DEFAULT_CLIENT_ID;
  const { containerRef, adRef, isUnfilled, isAdBlocked, refreshKey } = useAdSenseSlot({
    slot,
    clientId,
    autoRefresh,
    refreshIntervalSec,
    label: 'AuctionMobileBannerAd',
  });

  if (!slot || !clientId || isUnfilled) return null;
  if (isAdBlocked) {
    return (
      <div ref={containerRef} className={`w-full block sm:hidden ${className}`}>
        <AdBlockedNotice compact />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`w-full block sm:hidden overflow-hidden text-center ${className}`}>
      <div className="w-full max-w-[360px] mx-auto min-h-[50px] block overflow-hidden">
        <AdIns
          slot={slot}
          clientId={clientId}
          refreshKey={refreshKey}
          adRef={adRef}
          style={{ display: 'block', width: '100%', minHeight: '50px' }}
          format="horizontal"
        />
      </div>
    </div>
  );
};

export const AuctionSidebarActivityAd = ({
  slot = import.meta.env.VITE_ADSENSE_SIDEBAR_ACTIVITY_SLOT || import.meta.env.VITE_ADSENSE_LANDING_SLOT_2 || DEFAULT_SIDEBAR_ACTIVITY_SLOT,
  className = '',
  autoRefresh = true,
  refreshIntervalSec = 60
}) => {
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || DEFAULT_CLIENT_ID;
  const { containerRef, adRef, isUnfilled, isAdBlocked, refreshKey } = useAdSenseSlot({
    slot,
    clientId,
    autoRefresh,
    refreshIntervalSec,
    label: 'AuctionSidebarActivityAd',
  });

  if (!slot || !clientId || isUnfilled) return null;
  if (isAdBlocked) {
    return (
      <div ref={containerRef} className={`hidden md:flex w-full shrink-0 p-2 sm:p-2.5 ${className}`}>
        <AdBlockedNotice compact />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`hidden md:flex w-full shrink-0 border-b border-white/10 bg-[#0c0d10]/95 backdrop-blur-md p-2 sm:p-2.5 overflow-hidden flex-col items-center ${className}`}
    >
      <div className="w-full flex items-center justify-between pb-1 mb-1 border-b border-white/5 px-0.5">
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">
          Sponsored Link
        </span>
      </div>
      <div className="w-full block min-h-[50px] overflow-hidden text-center">
        <AdIns
          slot={slot}
          clientId={clientId}
          refreshKey={refreshKey}
          adRef={adRef}
          format="rectangle, horizontal"
        />
      </div>
    </div>
  );
};

export const AuctionTeamsInFeedAd = ({
  slot = import.meta.env.VITE_ADSENSE_TEAMS_AD_SLOT || DEFAULT_TEAMS_AD_SLOT,
  className = '',
  autoRefresh = true,
  refreshIntervalSec = 60
}) => {
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || DEFAULT_CLIENT_ID;
  const { containerRef, adRef, isUnfilled, isAdBlocked, refreshKey } = useAdSenseSlot({
    slot,
    clientId,
    autoRefresh,
    refreshIntervalSec,
    label: 'AuctionTeamsInFeedAd',
  });

  if (!slot || !clientId || isUnfilled) return null;
  if (isAdBlocked) {
    return (
      <div ref={containerRef} className={`my-2 ${className}`}>
        <AdBlockedNotice compact />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`my-2 p-2 rounded-xl border border-white/10 bg-[#0e1015]/90 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between pb-1 mb-1 border-b border-white/5 px-1">
        <span className="text-[7.5px] font-black uppercase tracking-[0.25em] text-gray-500">
          Sponsored
        </span>
      </div>
      <div className="w-full block min-h-[50px] overflow-hidden text-center">
        <AdIns
          slot={slot}
          clientId={clientId}
          refreshKey={refreshKey}
          adRef={adRef}
          format="rectangle, horizontal"
        />
      </div>
    </div>
  );
};

export const LandingDisplayBannerAd = ({
  slot = import.meta.env.VITE_ADSENSE_LANDING_SLOT_1 || DEFAULT_LANDING_SLOT_1,
  className = '',
  label = 'Sponsored'
}) => {
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || DEFAULT_CLIENT_ID;
  const { containerRef, adRef, isUnfilled, isAdBlocked } = useAdSenseSlot({
    slot,
    clientId,
    rootMargin: '250px 0px',
    label: 'LandingDisplayBannerAd',
  });

  if (!slot || !clientId || isUnfilled) return null;
  if (isAdBlocked) {
    return (
      <section ref={containerRef} className={`relative z-10 w-full max-w-6xl mx-auto ${className}`} aria-label={label}>
        <AdBlockedNotice />
      </section>
    );
  }

  return (
    <section ref={containerRef} className={`relative z-10 w-full max-w-6xl mx-auto ${className}`} aria-label={label}>
      <div className="mb-3 flex items-center justify-center gap-3">
        <div className="h-px w-10 bg-white/10" />
        <span className="text-[8px] font-black uppercase tracking-[0.35em] text-gray-500">{label}</span>
        <div className="h-px w-10 bg-white/10" />
      </div>

      <div className="w-full text-center overflow-hidden rounded-2xl border border-white/5 bg-white/[0.015] p-2.5 sm:p-4 min-h-[140px] flex items-center justify-center">
        <AdIns slot={slot} clientId={clientId} adRef={adRef} />
      </div>
    </section>
  );
};

export const MultiplexAdSlot = LandingDisplayBannerAd;

export const AuctionSummaryAd = ({
  slot = import.meta.env.VITE_ADSENSE_AUCTION_SUMMARY_SLOT || import.meta.env.VITE_ADSENSE_LANDING_MULTIPLEX_SLOT || DEFAULT_LANDING_MULTIPLEX_SLOT,
  className = '',
  label = 'Sponsored Links'
}) => {
  return <MultiplexAdSlot slot={slot} className={className} label={label} />;
};

export const AuctionSummaryInFeedAd = ({
  slot = import.meta.env.VITE_ADSENSE_LANDING_SLOT_2 || DEFAULT_LANDING_SLOT_2,
  className = '',
  label = 'Sponsored'
}) => {
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || DEFAULT_CLIENT_ID;
  const { containerRef, adRef, isUnfilled, isAdBlocked } = useAdSenseSlot({
    slot,
    clientId,
    rootMargin: '250px 0px',
    label: 'AuctionSummaryInFeedAd',
  });

  if (!slot || !clientId || isUnfilled) return null;
  if (isAdBlocked) {
    return (
      <div ref={containerRef} className={`w-full max-w-5xl mx-auto my-3 sm:my-4 ${className}`}>
        <AdBlockedNotice />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`w-full max-w-5xl mx-auto my-3 sm:my-4 ${className}`}>
      <div className="mb-2 flex items-center justify-center gap-2">
        <div className="h-px w-8 bg-white/10" />
        <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-[0.3em] text-gray-500">{label}</span>
        <div className="h-px w-8 bg-white/10" />
      </div>
      <div className="w-full text-center overflow-hidden rounded-2xl border border-white/5 bg-white/[0.015] p-2.5 sm:p-4 min-h-[120px] flex items-center justify-center">
        <AdIns slot={slot} clientId={clientId} adRef={adRef} />
      </div>
    </div>
  );
};

const AdSlot = ({
  slot,
  slot1 = import.meta.env.VITE_ADSENSE_LANDING_SLOT_1 || import.meta.env.VITE_ADSENSE_LANDING_FOOTER_SLOT || DEFAULT_LANDING_SLOT_1,
  slot2 = import.meta.env.VITE_ADSENSE_LANDING_SLOT_2 || DEFAULT_LANDING_SLOT_2,
  className = '',
  label = 'Advertisement'
}) => {
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || DEFAULT_CLIENT_ID;

  const activeSlots = (
    slot
      ? [slot]
      : [slot1, slot2]
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
