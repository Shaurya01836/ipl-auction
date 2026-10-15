import React, { useState, useEffect } from 'react';
// `motion` is used only inside JSX; core no-unused-vars can't detect that.
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, ChevronRight } from 'lucide-react';

const GAME_TIPS = [
  "TIP: Hosting a room is free. Tap Create Room, pick your franchise, and share the 6-character code with your crew.",
  "TIP: Playing solo? Hit Fill Bots in the lobby to let smart AI managers fill every empty franchise instantly.",
  "TIP: Public rooms are listed in the Join tab - jump into an open auction without needing a room code.",
  "TIP: Watch your purse. Reserve budget for your mandatory squad slots so you are never priced out late.",
  "DID YOU KNOW: CrickAuction enforces the overseas quota automatically - max 8 in Mega, 4 in Classic, 2 in Sprint.",
  "TIP: Toggle your room Public or Private before starting so only the right players can join.",
  "DID YOU KNOW: Every completed auction is saved to your History tab with full squads, spends, and ratings.",
  "TIP: No account needed - continue as a guest manager and start bidding in seconds."
];

const PageLoader = ({ isGame = false }) => {
  const [, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  // Ensure loader UI stays visible for at least 2 seconds
  const [showLoader, setShowLoader] = useState(true);
  const skippedIntro = useSkippedLocalState();

  // Check if we are on the landing page
  const isGameMode = isGame || (typeof window !== 'undefined' && window.location.pathname === '/');

  useEffect(() => {
    if (!isGameMode) return;

    // Load progress based on actual page load event
    let progressInterval = null;
    let simulatedInterval = null;
    const finishLoading = () => {
      setProgress(100);
      setIsLoaded(true);
      setShowLoader(false);
      if (progressInterval) clearInterval(progressInterval);
      if (simulatedInterval) clearInterval(simulatedInterval);
    };

    const startRealProgress = () => {
      // Increment progress slowly until the page load event fires (stop near 95% to keep animation smooth)
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            return prev; // pause increment, wait for load event
          }
          return prev + 0.5; // smooth gradual increase
        });
      }, 30);
    };

    // Start with a deterministic 2‑second simulated loading
    const simulatedStep = 100 / (2000 / 30);
    simulatedInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          return prev;
        }
        return Math.min(prev + simulatedStep, 95);
      });
    }, 30);

    // After 2 seconds switch to real progress handling
    const switchTimeout = setTimeout(() => {
      if (simulatedInterval) clearInterval(simulatedInterval);
      startRealProgress();
      // Ensure at least 2s display before considering load
      if (document.readyState === 'complete') {
        finishLoading();
      } else {
        window.addEventListener('load', finishLoading);
      }
    }, 2000);

    // No immediate load listener; will be attached after simulated phase
    
  // Rotate tips every 10 seconds
    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % GAME_TIPS.length);
    }, 10000);

    // Keyboard listener to skip/continue
    const handleKeyDown = (e) => {
      if (e.key === 'x' || e.key === 'X' || e.key === 'Enter') {
        setIsLoaded(true);
        setProgress(100);
        document.dispatchEvent(new CustomEvent('skipIntro'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

      return () => {
        if (progressInterval) clearInterval(progressInterval);
        if (simulatedInterval) clearInterval(simulatedInterval);
        if (switchTimeout) clearTimeout(switchTimeout);
        clearInterval(tipTimer);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('load', finishLoading);
      };
  }, [isGameMode]);

  // Handle local skip action
  const handleContinue = () => {
    setIsLoaded(true);
    setProgress(100);
    document.dispatchEvent(new CustomEvent('skipIntro'));
  };

  if (isGameMode && !skippedIntro) {
    return (
      <motion.div
        className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col justify-end p-6 md:p-12 overflow-hidden select-none font-sans text-white"
      >

        {/* Dynamic HTML/CSS Gaming Backdrop (Matches Landing Page Theme) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Ambient Glowing Orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 40, 0],
              y: [0, -20, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-[#ff5500]/15 blur-[130px] rounded-full"
          />
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              x: [0, -30, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-blue-600/10 blur-[130px] rounded-full"
          />

          {/* Texture Overlay (slow diagonal drift, top to bottom) */}
          <motion.div
            animate={{ x: [0, 400], y: [0, 400] }}
            transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-[400px] bg-[url('https://res.cloudinary.com/drl6ky9as/image/upload/v1792012081/texture_os1ukf.jpg')] bg-repeat bg-[length:600px_600px] sm:bg-[length:800px_800px] opacity-[0.45] mix-blend-screen"
          />

          {/* Radial Overlay to darken edges (Vignette) */}
          <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_20%,#050505_95%]" />
        </div>

        {/* Top-Right: Brand Lockup */}
        <div
          className="absolute top-6 right-6 z-10 flex items-center gap-2.5 bg-white/[0.04] border border-white/10 pl-2 pr-4 py-2 rounded-full backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/15 border border-white/30">
            <Gavel size={14} className="" />
          </span>
          <div className="flex flex-col leading-none">
            <span
              className="text-[20px] bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent"
              style={{ fontFamily: '"Geist Pixel", Silkscreen, VT323, "Geist Mono", monospace', fontWeight: 600 }}
            >
              CrickAuction
            </span>
          </div>
        </div>

        {/* Bottom Loading Bar & Tips */}
        <div
          className="relative z-10 w-full max-w-7xl mx-auto flex flex-col gap-6"
        >

          {/* Tip Box & Spinning Seam Ball */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">

            {/* Game Tip / Trivia */}
            <div className="max-w-2xl bg-white/[0.02] border-l-4 border-orange-500 p-4 rounded-r-md backdrop-blur-md border border-white/5 border-l-0 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
              <span className="text-[9px] font-black tracking-widest text-orange-500 uppercase block mb-1">
                Loading Tip
              </span>
              <div className="min-h-[40px] flex items-center">
                <p className="text-xs md:text-sm font-semibold tracking-wide text-white/90 leading-relaxed">
                  {GAME_TIPS[tipIndex]}
                </p>
              </div>
            </div>

            {/* Bottom Right: Loading indicator / Enter button */}
            <div className="self-end md:self-auto flex items-center gap-4">
              <AnimatePresence mode="wait">
                {(!isLoaded && showLoader) ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-md backdrop-blur-md shadow-lg"
                  >
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                      Loading
                    </span>
                    {/* Spinning Cricket ball representation */}
                    <motion.div
                      className="w-7 h-7 rounded-full bg-red-600 border border-red-700 relative overflow-hidden flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    >
                      {/* White ball seam */}
                      <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70 transform -translate-x-1/2 border-dashed border-spacing-1" />
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white/10 transform -translate-y-1/2" />
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="enter"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <button
                      onClick={handleContinue}
                      className="group relative overflow-hidden flex items-center gap-2.5 bg-[#ff5500] text-white font-black uppercase tracking-[0.2em] text-[11px] px-7 py-3.5 rounded-2xl border border-white/10 transition-all cursor-pointer duration-200 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#ff5500]/50 focus:ring-offset-2 focus:ring-offset-[#050505]"
                    >
                      <span className="relative z-10">Enter Auction Room</span>
                      <ChevronRight size={15} className="relative z-10 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Minimal full-width loading line at the very bottom */}
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full w-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
          </div>

        </div>
      </motion.div>
    );
  }

  // Original Minimal Loader for other pages/sections
  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center p-4">
      {/* Background Match */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative flex items-center justify-center w-12 h-12 mb-6">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white/10 border-t-orange-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
};

// Helper hook to check if intro was skipped locally
const useSkippedLocalState = () => {
  const [skipped, setSkipped] = useState(false);
  useEffect(() => {
    const handleSkip = () => setSkipped(true);
    document.addEventListener('skipIntro', handleSkip);
    return () => document.removeEventListener('skipIntro', handleSkip);
  }, []);
  return skipped;
};

export default PageLoader;
