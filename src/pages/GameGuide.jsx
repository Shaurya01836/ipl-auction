import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ChevronRight, ChevronDown } from 'lucide-react';
import Footer from '../components/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';

const GameGuide = () => {
  useDocumentTitle('Rulebook | CrickAuction', 'Comprehensive guide on how to play CrickAuction.');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [activeSection, setActiveSection] = useState('modes');
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const sections = [
    { id: 'modes', label: '1. Game modes' },
    { id: 'how-to-play', label: '2. How to play' },
    { id: 'bots', label: '3. AI bots' },
    { id: 'faq', label: '4. FAQ' },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    const handleScroll = () => {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
        setActiveSection(sections[sections.length - 1].id);
      }
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  const gameModes = [
    {
      id: 'mega',
      title: 'Mega Auction',
      subtitle: 'Full rules',
      budget: '₹120.0 Cr',
      squad: '25 players',
      overseas: '8 maximum',
      description: 'The complete IPL auction experience. Bid across all player pools to construct a full 25-man squad.',
    },
    {
      id: 'sprint11',
      title: '11-Player Classic',
      subtitle: 'Fast paced',
      budget: '₹60.0 Cr',
      squad: '11 players',
      overseas: '4 maximum',
      description: 'Quick competitive mode where each franchise builds a playing XI directly without bench filler.',
    },
    {
      id: 'sprint5',
      title: '5-Player Mini Sprint',
      subtitle: '10-minute battle',
      budget: '₹30.0 Cr',
      squad: '5 players',
      overseas: '2 maximum',
      description: 'Ultra-fast battle for quick sessions. Pick only top core superstars to construct a high-impact core.',
    }
  ];

  const auctionSteps = [
    {
      step: '1',
      title: 'Create or join a hub',
      desc: 'Host a fresh auction room or join using a 6-character room code. Choose your preferred franchise logo.'
    },
    {
      step: '2',
      title: 'Claim franchises & fill bots',
      desc: 'Each real player selects one of the 10 franchises. The host can tap "Fill bots" to add smart AI bidders to empty teams.'
    },
    {
      step: '3',
      title: 'Live bidding & timer',
      desc: 'Players are presented one by one. Click "+ Bid" to raise the price. When the timer hits zero, the highest bidder wins the player.'
    },
    {
      step: '4',
      title: 'Roster & budget management',
      desc: 'Monitor your remaining purse. Reserve purse space for your mandatory squad capacity and respect the overseas player quota.'
    },
    {
      step: '5',
      title: 'Summary & rating',
      desc: 'At the end of the auction, inspect the leaderboard, review total purse spent, and view complete team rosters.'
    }
  ];

  const botFeatures = [
    {
      title: 'Smart valuation engine',
      desc: 'Bots evaluate players based on base price, star rating, role balance, and team personality.'
    },
    {
      title: 'Dynamic slot protection',
      desc: 'Bots dynamically reserve purse per remaining empty slot so they never run out of funds prematurely.'
    },
    {
      title: 'Overseas & role compliance',
      desc: 'AI managers track overseas quotas and role distribution to prevent unbalanced squads.'
    }
  ];

  const faqs = [
    {
      q: 'How do I start a game with friends?',
      a: 'Simply click "Create Room" on the home page, select an auction mode, pick your franchise, and share the 6-character room code with your friends.'
    },
    {
      q: 'Can I play solo against AI Bots?',
      a: 'Yes. Create a room, select your team, and click the "Fill bots" button at the top. Smart AI franchise managers will immediately fill all remaining empty franchises.'
    },
    {
      q: 'What happens if the bid timer reaches zero?',
      a: 'When the countdown expires, the player is sold to the franchise holding the highest bid. If no one bids, they are marked as unsold.'
    },
    {
      q: 'Is there a limit on how many overseas players I can buy?',
      a: 'Yes. In Mega Auction mode, squads are capped at a maximum of 8 overseas players. In 11-Player mode the limit is 4, and in 5-Player Mini Sprint the limit is 2.'
    },
    {
      q: 'What happens if a player disconnects during the auction?',
      a: 'The game uses real-time state synchronization. If a player refreshes their browser, they will seamlessly rejoin the live bidding room.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans selection:bg-white/20 selection:text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium tracking-wide">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
            <Home size={14} />
            <span>Home</span>
          </Link>
          <ChevronRight size={14} className="text-gray-600" />
          <span className="text-gray-500">Legal</span>
          <ChevronRight size={14} className="text-gray-600" />
          <span className="text-white">Rulebook</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-12 lg:gap-24 items-start w-full flex-1">
        {/* Left TOC */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-28">
          <h3 className="text-white font-semibold text-sm mb-4">On this page</h3>
          <nav className="flex flex-col gap-2.5 border-l border-white/10">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`text-sm text-left pl-4 -ml-[1px] border-l ${activeSection === s.id ? 'border-[#ff5500] text-white' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-white/30'} transition-colors`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-3xl w-full pb-20">
          <div className="mb-12 border-b border-white/10 pb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">Rulebook</h1>
            <p className="text-sm text-gray-500 mb-6">Last updated: October 2, 2026</p>
            <p className="text-base text-gray-300 leading-relaxed">
              This guide outlines how to host live bidding sessions, build balanced championship rosters, manage purse budgets, and utilize AI bots in CrickAuction.
            </p>
          </div>

          <div className="space-y-16">
            
            {/* 1. Game Modes */}
            <section id="modes" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-6">1. Game modes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameModes.map(mode => (
                  <div key={mode.id} className="border border-white/10 rounded-md p-5 bg-white/[0.01]">
                    <div className="mb-4">
                      <h3 className="font-semibold text-white text-base">{mode.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{mode.subtitle}</p>
                    </div>
                    
                    <div className="space-y-2 mb-5 text-sm">
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-gray-400">Purse</span>
                        <span className="text-white font-medium">{mode.budget}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-gray-400">Squad</span>
                        <span className="text-white font-medium">{mode.squad}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-gray-400">Overseas</span>
                        <span className="text-white font-medium">{mode.overseas}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. How to play */}
            <section id="how-to-play" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-6">2. How to play</h2>
              <div className="space-y-6">
                {auctionSteps.map((s) => (
                  <div key={s.step} className="flex gap-4 items-start">
                    <div className="w-6 h-6 shrink-0 rounded-full border border-white/10 flex items-center justify-center text-xs font-semibold text-gray-400 bg-white/5 mt-0.5">
                      {s.step}
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-white mb-1.5">{s.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. AI bots */}
            <section id="bots" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-6">3. AI bots</h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                If friends cannot make it, AI bots step in as full, intelligent franchise managers with unique team personalities.
              </p>
              <div className="space-y-4">
                {botFeatures.map(f => (
                  <div key={f.title} className="border-l-2 border-white/10 pl-4">
                    <h3 className="text-sm font-medium text-white mb-1">{f.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. FAQ */}
            <section id="faq" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-6">4. FAQ</h2>
              <div className="border-t border-white/10">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border-b border-white/10">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full py-4 flex items-center justify-between text-left hover:text-white transition-colors text-gray-300 group"
                    >
                      <span className="text-sm font-medium">{faq.q}</span>
                      <ChevronDown
                        size={16}
                        className={`text-gray-500 transition-transform duration-200 shrink-0 ${openFaq === idx ? 'rotate-180 text-white' : 'group-hover:text-gray-400'}`}
                      />
                    </button>
                    <AnimatePresence>
                      {openFaq === idx && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pb-4 text-sm text-gray-400 leading-relaxed">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default GameGuide;
