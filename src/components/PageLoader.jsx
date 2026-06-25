import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Gavel } from 'lucide-react';

const PageLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center p-4">
      {/* Background Match */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Animated Icon Ring */}
        <div className="relative flex items-center justify-center w-20 h-20 mb-6">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white/5 border-t-[#ff5500]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border border-white/10"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            animate={{ scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-white/80"
          >
            <Gavel size={24} className="transform -rotate-45" />
          </motion.div>
        </div>

        {/* Loading Text */}
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-1.5">
          IPL Auction Hub
        </h2>
        <div className="flex items-center justify-center gap-2">
          <Loader2 size={12} className="text-gray-500 animate-spin" />
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
            Connecting to Hub...
          </span>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
