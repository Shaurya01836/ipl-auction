import React, { useState, useEffect } from 'react';
import { IPL_PLAYERS } from '../data/players';
import { TEAMS } from '../data/teams';
import { motion, AnimatePresence } from 'framer-motion';


const getShortName = (name) => {
  const parts = name.split(' ');
  if (parts.length > 1) {
    // e.g. "Jasprit Bumrah" -> "J. Bumrah"
    return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
  }
  return name;
};

const generateMockNotification = (existingIds = new Set()) => {
  // 1. Pick a random player
  let player = IPL_PLAYERS[Math.floor(Math.random() * IPL_PLAYERS.length)];
  let attempts = 0;
  while (existingIds.has(player.id) && attempts < 5) {
    player = IPL_PLAYERS[Math.floor(Math.random() * IPL_PLAYERS.length)];
    attempts++;
  }

  // 2. Pick a random team
  const team = TEAMS[Math.floor(Math.random() * TEAMS.length)];


  // 4. Generate realistic pricing
  const base = player.basePrice || 2.0;
  let multiplier = 1.0;
  if (base >= 2.0) {
    multiplier = 1.2 + Math.random() * 8.8; // up to 20 Cr
  } else {
    multiplier = 1.0 + Math.random() * 4.0; // up to 5-10 Cr
  }
  const finalPrice = parseFloat((base * multiplier).toFixed(2));

  return {
    id: Math.random().toString(36).substring(2, 9),
    player,
    team,
    price: finalPrice
  };
};

export default function AuctionActivityFeed({ activeCount = 0, stats = null }) {
  const [notifications, setNotifications] = useState([]);
  const [fakeCount, setFakeCount] = useState(14);
  const [fakeTotal, setFakeTotal] = useState(48);

  const liveRooms =
    stats?.activeCount !== undefined && stats?.activeCount !== null
      ? (stats.activeCount > 0 ? stats.activeCount : fakeCount)
      : (activeCount > 0 ? activeCount : fakeCount);

  const totalRecent =
    stats?.totalRecent !== undefined && stats?.totalRecent !== null
      ? (stats.totalRecent > 0 ? stats.totalRecent : fakeTotal)
      : fakeTotal;

  // Initialize with 8 historical notifications to fill the height
  useEffect(() => {
    const initial = [];
    const usedIds = new Set();
    for (let i = 0; i < 8; i++) {
      const mock = generateMockNotification(usedIds);
      usedIds.add(mock.player.id);
      initial.push(mock);
    }
    setNotifications(initial);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFakeCount(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = prev + delta;
        return next >= 10 && next <= 25 ? next : prev;
      });
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic timeout to push a new notification at variable intervals (2s to 10s)
  useEffect(() => {
    let timeoutId;

    const pushNotification = () => {
      setNotifications(prev => {
        const usedIds = new Set(prev.map(n => n.player.id));
        const newNotification = generateMockNotification(usedIds);
        // Add to top, keep maximum 9 notifications in memory
        return [newNotification, ...prev.slice(0, 8)];
      });

      // Generate a random delay between 2000ms (2s) and 10000ms (10s)
      const randomDelay = Math.floor(Math.random() * 8000) + 2000;
      timeoutId = setTimeout(pushNotification, randomDelay);
    };

    // Schedule the first mock notification
    const initialDelay = Math.floor(Math.random() * 8000) + 2000;
    timeoutId = setTimeout(pushNotification, initialDelay);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <>
      {/* Background glow blob */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-white/5 blur-[40px] rounded-full pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col flex-shrink-0">
        <h2 className="text-sm sm:text-base font-pixel uppercase text-white tracking-wider leading-none flex items-center gap-2">
          <span>LIVE AUCTION ACTIVITY</span>
        </h2>
        
        {/* Dynamic Activity Stats Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mt-2.5 select-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="text-[9px] sm:text-[10px] font-pixel uppercase tracking-widest leading-none">
              {liveRooms} Live
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
            <span className="text-[9px] sm:text-[10px] font-pixel uppercase tracking-widest leading-none">
              {totalRecent}+ Today
            </span>
          </div>
        </div>

        {/* Divider Line */}
        <div className="w-full h-px bg-white/10 my-3.5" />

        {/* Recent Signings Section Label */}
        <span className="text-[10px] text-gray-500 font-pixel uppercase tracking-widest mb-2.5 flex-shrink-0">
          Recent Signings
        </span>
      </div>

      {/* Compact Single-line Signings List */}
      <div className="h-[111px] md:h-[330px] overflow-hidden relative flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
                opacity: { duration: 0.12 },
                height: { type: 'spring', stiffness: 400, damping: 30 },
                layout: { type: 'spring', stiffness: 400, damping: 30 }
              }}
              className="w-full flex-shrink-0 overflow-hidden"
            >
              <div className="border-b border-white/[0.03] pb-1.5">
                <div className="flex items-center justify-between gap-3 text-[11px] font-bold py-1 px-1.5 rounded-md hover:bg-white/[0.02] transition-colors group">
                  {/* Left Column: Franchise + Action + Player Short Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <img 
                      src={notif.team.logo} 
                      alt={notif.team.id} 
                      decoding="async"
                      loading="lazy"
                      className="w-4.5 h-4.5 object-contain flex-shrink-0 group-hover:scale-105 transition-transform" 
                    />
                    <div className="truncate text-gray-400">
                      <span className="text-white font-black uppercase tracking-wider">{notif.team.id}</span>
                      <span className="mx-1 text-gray-600 font-medium">signed</span>
                      <span className="text-white font-bold tracking-wide">{getShortName(notif.player.name)}</span>
                    </div>
                  </div>

                  {/* Right Column: Price */}
                  <div className="text-right flex-shrink-0 text-white font-black italic tracking-wide group-hover:text-yellow-400 transition-colors">
                    ₹{notif.price.toFixed(2)} Cr
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
