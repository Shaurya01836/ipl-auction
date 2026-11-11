import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { clampTimer, pausedRemainingMs, timerProgress } from '../lib/auctionDisplay';

const AuctionCountdown = ({
   displayAuctionState,
   configuredBidTimer = 10,
   isAdmin = false,
   roomId,
   endPlayerAuction,
   getSyncedTime,
   playBeep,
   variant = 'all'
}) => {
   const timerTotal = configuredBidTimer > 0 ? configuredBidTimer : 10;
   const isTimerBidding = displayAuctionState?.status === 'bidding';
   const isTimerPaused = displayAuctionState?.status === 'paused';

   const getTime = useCallback(() => {
      return getSyncedTime ? getSyncedTime() : Date.now();
   }, [getSyncedTime]);

   const calculateTimeState = useCallback(() => {
      const rawMsRemaining = isTimerPaused
         ? pausedRemainingMs(displayAuctionState)
         : (isTimerBidding && displayAuctionState?.timerEndsAt
            ? Math.max(0, displayAuctionState.timerEndsAt - getTime())
            : 0);
      const rawSecondsRemaining = (isTimerBidding || isTimerPaused)
         ? Math.ceil(rawMsRemaining / 1000)
         : 0;
      const secondsRemaining = (isTimerBidding || isTimerPaused)
         ? clampTimer(rawSecondsRemaining, timerTotal)
         : 0;
      const timerPercent = (isTimerBidding || isTimerPaused)
         ? timerProgress(rawSecondsRemaining, timerTotal)
         : 0;

      return { rawMsRemaining, rawSecondsRemaining, secondsRemaining, timerPercent };
   }, [displayAuctionState, isTimerPaused, isTimerBidding, getTime, timerTotal]);

   const [timeState, setTimeState] = useState(calculateTimeState);

   // Synchronize time state when core auction state changes
   useEffect(() => {
      setTimeState(calculateTimeState());
   }, [calculateTimeState]);

   const lastBeepedSecRef = useRef(-1);
   const endTriggeredRef = useRef(false);
   const endTimerRef = useRef(null);

   // Reset end trigger lock only when a new player comes up
   useEffect(() => {
      endTriggeredRef.current = false;
      if (endTimerRef.current) {
         clearTimeout(endTimerRef.current);
         endTimerRef.current = null;
      }
   }, [displayAuctionState?.playerId]);

   // Independent 200ms timer loop isolated inside AuctionCountdown
   useEffect(() => {
      if (!displayAuctionState || (displayAuctionState?.status !== 'bidding' && displayAuctionState?.status !== 'paused')) {
         return;
      }

      if (displayAuctionState?.status === 'paused') {
         setTimeState(calculateTimeState());
         return;
      }

      lastBeepedSecRef.current = -1;

      const interval = setInterval(() => {
         const rawMs = displayAuctionState.timerEndsAt - getTime();
         const diff = Math.max(0, Math.ceil(rawMs / 1000));

         if (diff > 0) {
            endTriggeredRef.current = false;
         }

         if (diff <= 5 && diff > 0 && diff !== lastBeepedSecRef.current) {
            lastBeepedSecRef.current = diff;
            if (playBeep) {
               playBeep(diff === 1 ? 880 : 440, 0.1);
            }
         }

         const rawSec = (displayAuctionState.status === 'bidding' || displayAuctionState.status === 'paused')
            ? Math.ceil(rawMs / 1000)
            : 0;
         const sec = clampTimer(rawSec, timerTotal);
         const pct = timerProgress(rawSec, timerTotal);

         setTimeState({
            rawMsRemaining: rawMs,
            rawSecondsRemaining: rawSec,
            secondsRemaining: sec,
            timerPercent: pct
         });

         if (diff === 0) {
            const shouldTrigger = (isAdmin || rawMs < -1500) && displayAuctionState.status === 'bidding' && !endTriggeredRef.current;
            if (shouldTrigger) {
               endTriggeredRef.current = true;
               clearInterval(interval);
               endTimerRef.current = setTimeout(() => {
                  if (endPlayerAuction && roomId) {
                     endPlayerAuction(roomId);
                  }
               }, 300);
            }
         }
      }, 200);

      return () => {
         clearInterval(interval);
         if (endTimerRef.current) {
            clearTimeout(endTimerRef.current);
            endTimerRef.current = null;
         }
      };
   }, [
      displayAuctionState?.timerEndsAt,
      displayAuctionState?.status,
      displayAuctionState?.remainingMs,
      displayAuctionState?.pausedAt,
      displayAuctionState?.playerId,
      isAdmin,
      roomId,
      endPlayerAuction,
      getTime,
      playBeep,
      timerTotal,
      calculateTimeState
   ]);

   const { secondsRemaining, timerPercent } = timeState;

   const renderProgressBar = () => (
      <div className="absolute top-0 inset-x-0 h-1 bg-white/5 pointer-events-none">
         <motion.div
            initial={{ width: "100%" }}
            animate={{ width: `${timerPercent}%` }}
            className={`h-full transition-colors duration-1000 ${
               isTimerPaused
                  ? 'bg-gray-500'
                  : secondsRemaining < 5
                     ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                     : 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]'
            }`}
         />
      </div>
   );

   const renderBadge = () => (
      <div
         className={`w-12 h-12 sm:w-14 sm:h-14 xl:w-16 xl:h-16 rounded-full flex flex-col items-center justify-center transition-all duration-300 border-2 backdrop-blur-md ${
            isTimerPaused
               ? 'border-slate-500/50 bg-[#0c0d10]/90 text-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.8)]'
               : secondsRemaining < 5
                  ? 'border-red-500 bg-[#0c0d10]/90 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.35),0_4px_20px_rgba(0,0,0,0.8)]'
                  : 'border-emerald-500/50 bg-[#0c0d10]/90 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25),0_4px_20px_rgba(0,0,0,0.8)]'
         }`}
      >
         {isTimerPaused ? (
            <>
               <span className="text-base sm:text-lg xl:text-xl font-black leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">{secondsRemaining}</span>
               <span className="text-[6px] md:text-[7px] font-bold tracking-widest uppercase mt-0.5 text-slate-400 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">PAUSED</span>
            </>
         ) : (
            <>
               <span className="text-base sm:text-lg xl:text-xl font-black leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">{secondsRemaining}</span>
               <span className="text-[6px] md:text-[7px] font-bold tracking-widest uppercase mt-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">Sec</span>
            </>
         )}
      </div>
   );

   if (variant === 'bar') return renderProgressBar();
   if (variant === 'badge') return renderBadge();

   return (
      <>
         {renderProgressBar()}
         {renderBadge()}
      </>
   );
};

export default memo(AuctionCountdown);

