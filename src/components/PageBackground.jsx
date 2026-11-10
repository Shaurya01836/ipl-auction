import React, { useState, useEffect } from 'react';
import {
  CricketBall,
  CricketBat,
  CricketStumps,
  CricketHelmet,
  CricketPitch,
  CricketExtras,
} from '../assets/cricket';

/**
 * PageBackground
 * A black stadium canvas behind the landing page:
 * 1. Near-black base (#0a0b0e -> #060607)
 * 2. Soft vignette + a whisper of cool stadium light
 * 3. Faint noise and dot grid so pure black never feels flat
 * 4. Cricket line art: one large ball behind the hero, bats/balls/helmets
 *    around the hero flanks in soft neutral greys.
 *
 * The art stays faint and masked so the page still reads as simple, and it
 * never touches the footer area.
 */
const NOISE_SVG_URI = `data:image/svg+xml;utf8,<svg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'><filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23noise)' opacity='0.8'/></svg>`;

const NEUTRAL = '#c2cad8';
const MUTED = '#8f98a8';

const TOP_ITEMS = [
  // Large centrepiece behind the headline. Fluid size keeps mobile sane.
  {
    id: 'hero-ball',
    type: 'ball',
    style: { left: '50%', top: '10%' },
    size: 440,
    rotate: 12,
    opacity: 0.05,
    color: NEUTRAL,
    strokeWidth: 0.5,
    center: true,
    className: 'w-[230px] h-[230px] sm:w-[440px] sm:h-[440px]',
  },

  // Left flank, kept inside the hero band (above the main card).
  { id: 'top-l1', type: 'bat', style: { left: '1%', top: '4%' }, size: 170, rotate: -18, opacity: 0.18, color: NEUTRAL, mobile: false },
  { id: 'top-l2', type: 'ball', style: { left: '8%', top: '15%' }, size: 135, rotate: 18, opacity: 0.16, color: MUTED, mobile: false },
  { id: 'top-l4', type: 'stumps', style: { left: '2%', top: '26%' }, size: 155, rotate: -8, opacity: 0.14, color: NEUTRAL, mobile: false },
  { id: 'top-l5', type: 'extras_stitches', style: { left: '12%', top: '29%' }, size: 28, rotate: 20, opacity: 0.14, color: MUTED, mobile: false },

  // Right flank, mirrored.
  { id: 'top-r1', type: 'ball', style: { right: '2%', top: '5%' }, size: 150, rotate: -18, opacity: 0.16, color: NEUTRAL, mobile: false },
  { id: 'top-r2', type: 'helmet', style: { right: '8%', top: '16%' }, size: 165, rotate: 16, opacity: 0.16, color: MUTED, mobile: false },
  { id: 'top-r4', type: 'pitch', style: { right: '1%', top: '27%' }, size: 150, rotate: -8, opacity: 0.13, color: NEUTRAL, mobile: false },
  
];

// Small pieces tucked into the empty side gutters on phones. The desktop
// flanks are hidden there, so these keep the hero from looking bare.
const MOBILE_ITEMS = [
  { id: 'm-l1', type: 'ball', style: { left: '2%', top: '9%' }, size: 42, rotate: 15, opacity: 0.24, color: NEUTRAL },
  { id: 'm-l2', type: 'extras_stitches', style: { right: '3%', top: '10%' }, size: 30, rotate: -12, opacity: 0.22, color: MUTED },
  { id: 'm-l3', type: 'bat', style: { left: '1%', top: '14%' }, size: 46, rotate: -16, opacity: 0.22, color: NEUTRAL },
  { id: 'm-l4', type: 'helmet', style: { right: '2%', top: '16%' }, size: 40, rotate: 12, opacity: 0.20, color: NEUTRAL },

];

const renderSvgByType = (item, size) => {
  const stroke = item.strokeWidth ? { strokeWidth: item.strokeWidth } : {};
  const className = item.className || '';
  switch (item.type) {
    case 'ball':
      return <CricketBall size={size} className={className} {...stroke} />;
    case 'bat':
      return <CricketBat size={size} className={className} {...stroke} />;
    case 'stumps':
      return <CricketStumps size={size} className={className} {...stroke} />;
    case 'helmet':
      return <CricketHelmet size={size} className={className} {...stroke} />;
    case 'pitch':
      return <CricketPitch size={size} className={className} {...stroke} />;
    case 'extras_stitches':
      return <CricketExtras variant="stitches" size={size} className={className} />;
    case 'extras_dots':
      return <CricketExtras variant="dots" size={size} className={className} />;
    case 'extras_cross':
    default:
      return <CricketExtras variant="cross" size={size} className={className} />;
  }
};

const renderItem = (item) => {
  const size = item.size || 175;
  return (
    <div
      key={item.id}
      className={`absolute pointer-events-none ${item.mobile === false ? 'hidden sm:block' : ''}`}
      style={{
        ...item.style,
        color: item.color || '#a4afc1',
        opacity: item.opacity,
        transform: `${item.center ? 'translateX(-50%) ' : ''}rotate(${item.rotate || 0}deg)`,
      }}
    >
      {/* Soft duplicate adds depth without a heavy glow. */}
      <div className="absolute inset-0 scale-110 blur-[3px] opacity-35" aria-hidden="true">
        {renderSvgByType(item, size)}
      </div>
      <div className="relative">{renderSvgByType(item, size)}</div>
    </div>
  );
};

const PageBackground = ({ showArt = true }) => {
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const offset = Math.min(28, Math.max(0, window.scrollY * 0.035));
          setParallaxY(offset);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="absolute inset-0 w-full min-h-full overflow-hidden pointer-events-none z-0 select-none"
      aria-hidden="true"
    >
      {/* 1. Black base */}
      <div
        className="fixed inset-0 pointer-events-none -z-20"
        style={{
          background:
            'linear-gradient(to bottom, var(--bg-gradient-top, #0a0b0e) 0%, #08090b 45%, var(--bg-gradient-bottom, #060607) 100%)',
        }}
      />

      {/* 2. Cool stadium light (neutral only, no warm tint) */}
      <div
        className="fixed inset-0 pointer-events-none -z-20"
        style={{
          background:
            'radial-gradient(ellipse 42% 35% at 84% 46%, rgba(56, 132, 255, 0.03) 0%, transparent 70%)',
        }}
      />

      {/* 3. Vignette */}
      <div
        className="fixed inset-0 pointer-events-none -z-20"
        style={{
          background:
            'radial-gradient(ellipse 88% 76% at 50% 28%, transparent 45%, var(--bg-charcoal-vignette, rgba(0, 0, 0, 0.55)) 100%)',
        }}
      />

      {/* 4. Noise keeps black from looking like an empty void */}
      <div
        className="fixed inset-0 pointer-events-none -z-20 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("${NOISE_SVG_URI}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '160px 160px',
        }}
      />

      {/* 5. Dot grid, fading down the page */}
      <div
        className="fixed inset-0 pointer-events-none -z-20 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.75) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 35%, rgba(0,0,0,0) 65%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 35%, rgba(0,0,0,0) 65%)',
        }}
      />

      {/* 6. Cricket line art around the hero and card (opt out on text pages) */}
      {showArt && (
      <div
        className="absolute top-0 left-0 right-0 h-[880px] pointer-events-none -z-10 overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 70px, black 600px, transparent 880px)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 70px, black 600px, transparent 880px)',
        }}
      >
        <div
          className="relative w-full h-full will-change-transform"
          style={{
            transform: `translate3d(0, ${parallaxY}px, 0)`,
            transition: 'transform 0.1s ease-out',
          }}
        >
          {TOP_ITEMS.map(renderItem)}
        </div>
        <div className="absolute inset-0 sm:hidden">
          {MOBILE_ITEMS.map(renderItem)}
        </div>
      </div>
      )}
    </div>
  );
};

export default PageBackground;
