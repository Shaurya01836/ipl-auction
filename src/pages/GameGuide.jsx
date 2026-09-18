import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ChevronDown } from 'lucide-react';
import Footer from '../components/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';

const GameGuide = () => {
  useDocumentTitle(
    'Game Guide & Auction Rules | IPL Auction Simulator',
    'Comprehensive guide on how to host and play IPL Mega Auctions, manage budgets, bid on players, RTM rules, and squad limits.'
  );
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const gameModes = [
    {
      id: 'mega',
      title: 'Mega Auction (Full Rules)',
      budget: '₹120.0 Cr',
      squad: '25 Players',
      overseas: 'Max 8 Overseas',
      description: 'The complete IPL auction experience. Bid across all player pools (Marquee, Batsmen, Bowlers, Wicket-Keepers, All-Rounders, Uncapped) to construct a full 25-man squad.',
      badge: 'MOST POPULAR',
      badgeColor: 'bg-[#ff5500]/20 text-[#ff5500] border-[#ff5500]/30'
    },
    {
      id: 'sprint11',
      title: '11-Player Classic',
      budget: '₹60.0 Cr',
      squad: '11 Players',
      overseas: 'Max 4 Overseas',
      description: 'Quick competitive mode where each franchise builds a playing XI directly without bench filler. Fast-paced and intense budget battles.',
      badge: 'FAST PACED',
      badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    },
    {
      id: 'sprint5',
      title: '5-Player Mini Sprint',
      budget: '₹30.0 Cr',
      squad: '5 Key Players',
      overseas: 'Max 2 Overseas',
      description: 'Ultra-fast 10-minute battle for quick sessions. Pick only top core superstars to construct a high-impact 5-player dream core.',
      badge: '10-MIN BATTLE',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    }
  ];

  const auctionSteps = [
    {
      step: '01',
      title: 'Create or Join a Hub',
      desc: 'Host a fresh auction room or join using a 6-character room code. Choose your preferred IPL Franchise logo to represent your team.'
    },
    {
      step: '02',
      title: 'Claim Franchises & Fill AI Bots',
      desc: 'Each real player selects one of the 10 IPL franchises. If playing with fewer than 10 human managers, the host can tap "Fill Bots" to add smart AI bidders to empty teams.'
    },
    {
      step: '03',
      title: 'Live Bidding & Timer',
      desc: 'Players are presented one by one. Click "+ BID" to raise the price by the active bid increment. When the timer hits zero, the highest bidder wins the player!'
    },
    {
      step: '04',
      title: 'Roster & Budget Management',
      desc: 'Monitor your remaining purse dynamically. Make sure to reserve purse space for your mandatory squad capacity and respect the overseas player quota (max 8 in Mega).'
    },
    {
      step: '05',
      title: 'Summary & Championship Rating',
      desc: 'At the end of the auction, inspect the Leaderboard, review total purse spent, inspect complete team rosters, and celebrate the winning franchise!'
    }
  ];

  const botFeatures = [
    {
      title: 'Smart Valuation Engine',
      desc: 'Bots evaluate players based on base price, star rating, role balance, and team personality — e.g. MI aggressively targets fast bowlers, RCB overpays for marquee batsmen, and CSK prioritizes all-rounders.'
    },
    {
      title: 'Dynamic Slot Protection',
      desc: 'Bots dynamically reserve ₹0.40 Cr per remaining empty squad slot so they never run out of funds prematurely and can fulfill their squad size requirements.'
    },
    {
      title: 'Overseas & Role Compliance',
      desc: 'AI managers track overseas player quotas and role distribution to prevent unbalanced squads (e.g. max 8 overseas in Mega auction mode).'
    }
  ];

  const faqs = [
    {
      q: 'How do I start a game with friends?',
      a: 'Simply click "Create Room" on the home page, select an Auction Mode (Mega, 11-Player, or 5-Player Sprint), pick your franchise team, and share the generated 6-character room code or WhatsApp link with your friends!'
    },
    {
      q: 'Can I play solo against AI Bots?',
      a: 'Yes! Create a room, select your team, enter the Lobby, and click the "Fill Bots" button at the top. Smart AI franchise managers will immediately fill all remaining empty franchises so you can run a full auction single-handedly.'
    },
    {
      q: 'What happens if the bid timer reaches zero?',
      a: 'When the countdown timer expires, the player is sold to the franchise holding the highest bid. If no one bids on a player, they are marked as Unsold.'
    },
    {
      q: 'Is there a limit on how many overseas players I can buy?',
      a: 'Yes, just like real IPL rules! In Mega Auction mode, squads are capped at a maximum of 8 overseas players. In 11-Player mode the limit is 4, and in 5-Player Mini Sprint the limit is 2.'
    },
    {
      q: 'What happens if a player disconnects during the auction?',
      a: 'The game uses real-time state synchronization via Firebase. If a player re-opens the link or refreshes their browser, they will seamlessly rejoin the live bidding room right where they left off.'
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#050505] flex flex-col items-center py-8 px-4 font-sans text-white overflow-x-hidden">
      {/* Subtle Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] bg-[#ff5500]/10 blur-[140px] rounded-full" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-600/5 blur-[140px] rounded-full" />
      </div>

      {/* Navigation Header */}
      <header className="w-full max-w-5xl flex items-center justify-between gap-3 mb-8 sm:mb-12 z-20 px-1 sm:px-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 sm:px-4 sm:py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl sm:rounded-2xl transition-all group flex items-center gap-2 cursor-pointer"
        >
          <Home size={14} className="text-gray-400 group-hover:text-white transition-colors sm:w-[16px] sm:h-[16px]" />
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Home</span>
        </button>

        <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-gray-400 text-center truncate px-2">
          IPL Hub Rulebook
        </span>

      </header>

      {/* Hero Header */}
      <div className="text-center max-w-2xl z-10 mb-8 sm:mb-12 px-2 sm:px-4">
        <div className="inline-block border border-orange-500/30 bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest mb-3 sm:mb-4">
          GAME GUIDE & MANUAL
        </div>
        <p className="text-[11px] sm:text-sm text-gray-400 font-medium max-w-lg mx-auto mt-2.5 sm:mt-3.5 leading-relaxed">
          Learn how to host live IPL bidding wars, build balanced 25-man championship rosters, master purse budget management, and leverage AI Bots.
        </p>
      </div>

      {/* Main Content Container */}
      <main className="w-full max-w-5xl z-10 space-y-10 sm:space-y-14">
        
        {/* Navigation Tabs (2x2 on mobile, 1x4 on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 bg-white/[0.02] p-1.5 rounded-2xl border border-white/5 max-w-xl mx-auto">
          {[
            { id: 'overview', label: 'Game Modes' },
            { id: 'flow', label: 'How to Play' },
            { id: 'bots', label: 'AI Bots' },
            { id: 'faq', label: 'FAQ' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center truncate ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#ff5500] to-[#ff8c00] text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Section 1: Game Modes */}
        {activeTab === 'overview' && (
          <section className="space-y-4 sm:space-y-6">
            <div className="text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white">
                Auction Game Modes
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium mt-1">Choose the mode that fits your group size and session length.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {gameModes.map(mode => (
                <div
                  key={mode.id}
                  className="bg-[#0c0c0c] border border-white/10 rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 flex flex-col justify-between shadow-xl"
                >
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${mode.badgeColor}`}>
                        {mode.badge}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest">{mode.id.toUpperCase()}</span>
                    </div>

                    <h3 className="text-sm sm:text-base font-black uppercase tracking-wide text-white">
                      {mode.title}
                    </h3>

                    <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed font-medium">
                      {mode.description}
                    </p>
                  </div>

                  <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px] sm:text-[10px]">Starting Purse</span>
                      <span className="font-black text-yellow-400 text-xs">{mode.budget}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px] sm:text-[10px]">Squad Target</span>
                      <span className="font-black text-blue-400 text-xs">{mode.squad}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px] sm:text-[10px]">Overseas Quota</span>
                      <span className="font-black text-purple-400 text-xs">{mode.overseas}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 2: How to Play Step-by-Step */}
        {activeTab === 'flow' && (
          <section className="space-y-4 sm:space-y-6">
            <div className="text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white">
                Step-by-Step Match Flow
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium mt-1">From room creation to hoisting the IPL Auction trophy.</p>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {auctionSteps.map((s) => (
                <div
                  key={s.step}
                  className="bg-[#0c0c0c] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex items-start sm:items-center gap-3.5 sm:gap-5"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <span className="text-[11px] sm:text-xs font-black text-[#ff5500]">{s.step}</span>
                  </div>

                  <div className="flex-1 space-y-0.5 min-w-0">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide text-white truncate">{s.title}</h3>
                    <p className="text-[10px] sm:text-xs text-gray-400 font-medium leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: AI Bots Engine */}
        {activeTab === 'bots' && (
          <section className="space-y-4 sm:space-y-6">
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 relative overflow-hidden shadow-2xl">
              <div className="max-w-xl space-y-2 mb-4 sm:mb-6">
                <div className="inline-block px-2.5 py-0.5 rounded bg-[#ff5500]/20 border border-[#ff5500]/30 text-[#ff5500] text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                  AUTOMATED FRANCHISE MANAGERS
                </div>
                <h2 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-white">
                  How AI Bidding Bots Work
                </h2>
                <p className="text-[11px] sm:text-xs text-gray-400 font-medium leading-relaxed">
                  Never worry about empty franchise slots. If friends can’t make it, AI Bots step in as full, intelligent franchise managers with unique team personalities.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {botFeatures.map(f => (
                  <div key={f.title} className="bg-white/[0.02] border border-white/5 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
                    <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wide text-white">{f.title}</h3>
                    <p className="text-[10px] sm:text-xs text-gray-400 font-medium leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Section 4: Frequently Asked Questions */}
        {activeTab === 'faq' && (
          <section className="space-y-4 sm:space-y-6">
            <div className="text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white">
                Frequently Asked Questions
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium mt-1">Quick answers to common questions about gameplay and rules.</p>
            </div>

            <div className="space-y-2 sm:space-y-2.5">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-[#0c0c0c] border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02]"
                  >
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wide text-white">{faq.q}</span>
                    <ChevronDown
                      size={14}
                      className={`text-gray-500 transition-transform duration-300 shrink-0 ${openFaq === idx ? 'rotate-180 text-[#ff5500]' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-1 text-[10px] sm:text-xs text-gray-400 font-medium leading-relaxed border-t border-white/5">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      <Footer />
    </div>
  );
};

export default GameGuide;
