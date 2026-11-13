import React, { useEffect, useRef } from 'react';

const DEFAULT_CLIENT_ID = 'ca-pub-2952599241278941';
const DEFAULT_LANDING_SLOT = '6078587405';

const AdSlot = ({
  slot = import.meta.env.VITE_ADSENSE_LANDING_FOOTER_SLOT || DEFAULT_LANDING_SLOT,
  className = '',
  label = 'Advertisement'
}) => {
  const adRef = useRef(null);
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID || DEFAULT_CLIENT_ID;
  const canRenderAd = Boolean(clientId && slot);

  useEffect(() => {
    if (!canRenderAd) return;

    // Ensure the AdSense script is present in <head>
    if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
      const script = document.createElement('script');
      script.id = 'google-adsense-script';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      document.head.appendChild(script);
    }

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
    }, 100);

    return () => clearTimeout(timer);
  }, [canRenderAd, clientId, slot]);

  if (!canRenderAd) {
    return null;
  }

  return (
    <section className={`relative z-10 w-full max-w-6xl mx-auto ${className}`} aria-label={label}>
      <div className="mb-2 flex items-center justify-center gap-3">
        <div className="h-px w-10 bg-white/10" />
        <span className="text-[8px] font-black uppercase tracking-[0.35em] text-gray-500">{label}</span>
        <div className="h-px w-10 bg-white/10" />
      </div>
      <div className="w-full text-center overflow-hidden">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={clientId}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </section>
  );
};

export default AdSlot;
