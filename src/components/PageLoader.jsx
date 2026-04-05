import React from 'react';
import { motion } from 'framer-motion';
import { Gavel, Users, Zap } from 'lucide-react';

const SkeletonPulse = ({ className, children }) => (
  <div className={`relative overflow-hidden bg-white/5 rounded-lg ${className}`}>
    {children}
    <motion.div
      animate={{
        x: ['-200%', '300%'],
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: "linear",
      }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.1] to-transparent pointer-events-none"
    />
  </div>
);

const PageLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center overflow-y-auto py-12 px-4 scrollbar-hide">
      
      {/* Background Match */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-orange-600/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center my-auto">
        
        {/* Top Badge - Shows Text as it is */}
        <SkeletonPulse className="px-4 py-1.5 rounded-full mb-8 border border-yellow-500/20 bg-yellow-500/5 backdrop-blur-md">
           <div className="flex items-center gap-2 text-yellow-500 text-[10px] font-black uppercase tracking-widest opacity-40">
             <div className="w-1 h-1 bg-yellow-500 rounded-full animate-ping" />
             <Gavel size={12} strokeWidth={3} />
             IPL Auction Live
           </div>
        </SkeletonPulse>

        {/* Hero Section - Text as it is (ghosted) */}
        <div className="text-center mb-8 w-full flex flex-col items-center">
          <SkeletonPulse className="px-4 bg-transparent overflow-visible">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-1 opacity-20 text-white leading-tight uppercase">
              BUILD YOUR
            </h1>
          </SkeletonPulse>
          <SkeletonPulse className="px-4 bg-transparent overflow-visible">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-[#ff5500] italic leading-tight uppercase opacity-30">
              DREAM TEAM
            </h1>
          </SkeletonPulse>
          
          <div className="mt-2 flex items-center justify-center gap-4 text-gray-700 font-bold text-[10px] uppercase tracking-[0.2em]">
            <span className="flex items-center gap-1.5"><Users size={12} /> Multiplayer</span>
            <span className="w-0.5 h-0.5 bg-gray-800 rounded-full" />
            <span className="flex items-center gap-1.5"><Zap size={12} /> Real-time</span>
          </div>
        </div>

        {/* User Badge Skeleton */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-6 backdrop-blur-md opacity-40">
           <div className="w-7 h-7 rounded-full bg-white/10" />
           <div className="w-24 h-3 bg-white/10 rounded-full" />
           <div className="w-12 h-4 rounded-lg bg-white/5" />
        </div>

        {/* Main Action Card Skeleton */}
        <div className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] p-3 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
           <div className="bg-[#0c0c0c] rounded-[1.75rem] p-6 md:p-8 border border-white/5 space-y-6">
              
              {/* Tabs */}
              <div className="flex bg-white/5 p-1 rounded-xl mb-6">
                 <div className="flex-1 h-12 rounded-lg bg-orange-600/10 shadow-inner" />
                 <div className="flex-1 h-12 rounded-lg" />
                 <div className="flex-1 h-12 rounded-lg" />
              </div>

              {/* Form Content */}
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between mb-4 px-1">
                       <SkeletonPulse className="w-24 h-2.5 bg-white/5" />
                       <SkeletonPulse className="w-16 h-2.5 bg-orange-500/10" />
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                       {[...Array(10)].map((_, i) => (
                          <SkeletonPulse key={i} className="aspect-square rounded-2xl bg-white/[0.03]" />
                       ))}
                    </div>
                 </div>

                 <div>
                    <SkeletonPulse className="w-20 h-2.5 mb-4 bg-white/5" />
                    <div className="flex flex-col sm:flex-row gap-3">
                       <SkeletonPulse className="flex-1 h-20 rounded-2xl bg-orange-600/5 border border-white/5" />
                       <SkeletonPulse className="flex-1 h-20 rounded-2xl bg-white/[0.02]" />
                       <SkeletonPulse className="flex-1 h-20 rounded-2xl bg-white/[0.02]" />
                    </div>
                 </div>

                 {/* Action Button */}
                 <SkeletonPulse className="w-full h-14 rounded-xl bg-orange-600/20" />
              </div>

           </div>
        </div>

        {/* Footer Shimmer */}
        <div className="mt-12 flex flex-col items-center gap-4 text-center opacity-40">
           <SkeletonPulse className="p-2">
             <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.4em] italic mb-1">
               Not an ordinary IPL auction simulator
             </p>
           </SkeletonPulse>
           <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>

      <div className="fixed inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60 pointer-events-none" />
    </div>
  );
};

export default PageLoader;
