import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel } from 'lucide-react';

const GAME_TIPS = [
  "TIP: Manage your budget carefully. Overspending early on marquee players might leave you with a weak squad.",
  "DID YOU KNOW: MS Dhoni has captained the most matches in IPL history, leading in over 220 games.",
  "TIP: Make sure to retain at least one top-tier spinner. They are crucial during the middle overs.",
  "DID YOU KNOW: Virat Kohli holds the record for the most runs in a single IPL season, scoring 973 runs in 2016.",
  "TIP: Keep an eye on the base price of players. Snatching quality players at base price is the key to winning.",
  "DID YOU KNOW: Chris Gayle holds the record for the highest individual score in IPL history - 175* off 66 balls.",
  "TIP: Pace bowlers with good yorker execution are essential for controlling the death overs."
];

const PageLoader = ({ isGame = false }) => {
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check if we are on the landing page
  const isGameMode = isGame || (typeof window !== 'undefined' && window.location.pathname === '/');

  useEffect(() => {
    if (!isGameMode) return;

    // Simulate loading progress
    const duration = 2000; // 2 seconds
    const intervalTime = 30;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsLoaded(true);
          return 100;
        }
        return Math.min(prev + step, 100);
      });
    }, intervalTime);

    // Rotate tips every 4 seconds
    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % GAME_TIPS.length);
    }, 4000);

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
      clearInterval(timer);
      clearInterval(tipTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isGameMode]);

  // Handle local skip action
  const handleContinue = () => {
    setIsLoaded(true);
    setProgress(100);
    document.dispatchEvent(new CustomEvent('skipIntro'));
  };

  if (isGameMode && !skippedLocalState(isLoaded)) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col justify-end p-6 md:p-12 overflow-hidden select-none font-sans text-white">

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

          {/* Subtle Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

          {/* Radial Overlay to darken edges (Vignette) */}
          <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_20%,#050505_95%]" />
        </div>

        {/* Top-Right: Game Info Tag */}
        <div className="absolute top-6 right-6 z-10 flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest text-orange-400">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          IPL Auction Simulator
        </div>

        {/* Bottom Loading Bar & Tips */}
        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col gap-6">

          {/* Tip Box & Spinning Seam Ball */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">

            {/* Game Tip / Trivia */}
            <div className="max-w-2xl bg-white/[0.02] border-l-4 border-orange-500 p-4 rounded-r-md backdrop-blur-md border border-white/5 border-l-0 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
              <span className="text-[9px] font-black tracking-widest text-orange-500 uppercase block mb-1">
                Loading Tip
              </span>
              <div className="min-h-[40px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={tipIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                    className="text-xs md:text-sm font-semibold tracking-wide text-white/90 leading-relaxed"
                  >
                    {GAME_TIPS[tipIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Right: Spinning Cricket Ball Loading Icon */}
            <div className="self-end md:self-auto flex items-center gap-4">
              {!isLoaded ? (
                <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-md backdrop-blur-md shadow-lg">
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
                </div>
              ) : (
                <motion.button
                  onClick={handleContinue}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-md shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-all cursor-pointer animate-pulse"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                >
                  Click to Enter / Press Enter
                </motion.button>
              )}
            </div>

          </div>

          {/* Minimal full-width loading line at the very bottom */}
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full w-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
          </div>

        </div>
      </div>
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

// Helper hook/function to check if intro was skipped locally
const skippedLocalState = (isLoaded) => {
  const [skipped, setSkipped] = useState(false);
  useEffect(() => {
    const handleSkip = () => setSkipped(true);
    document.addEventListener('skipIntro', handleSkip);
    return () => document.removeEventListener('skipIntro', handleSkip);
  }, []);
  return skipped;
};

export default PageLoader;
