import React from 'react';
import { motion } from 'framer-motion';
import { Gavel } from 'lucide-react';

const BrandLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center overflow-hidden">
      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Sleek Icon Pulse */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.8 }}
           className="relative"
        >
           <Gavel size={28} strokeWidth={2} className="text-white opacity-40" />
           <motion.div
             animate={{ 
               scale: [1, 1.4, 1],
               opacity: [0, 0.5, 0]
             }}
             transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
             className="absolute inset-0 bg-white blur-xl rounded-full"
           />
        </motion.div>

        {/* Minimal Branding */}
        <div className="flex flex-col items-center gap-1">
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3"
          >
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.6em]">Syncing Hub</span>
          </motion.div>

          <div className="w-16 h-[1.5px] bg-white/[0.03] mt-2 relative overflow-hidden rounded-full">
             <motion.div 
               animate={{ x: ['-100%', '100%'] }}
               transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
               className="absolute inset-0 bg-orange-500/30"
             />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandLoader;
