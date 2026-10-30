import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  ChevronRight,
  ChevronDown,
  Coins,
  Users,
  TrendingUp,
  Target,
  Wifi,
  Sparkles,
  BookOpen,
  HelpCircle,
  Shield,
  ArrowRight,
} from 'lucide-react';
import Footer from '../components/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';

const FAQS = [
  {
    q: 'What is the purse budget for each franchise in the IPL 2026 Mega Auction?',
    a: 'In the official IPL 2026 Mega Auction rules simulated here, each franchise starts with a maximum purse budget of ₹120.00 Crore. In sprint modes, budget scales proportionally: ₹60.00 Crore for the 11-Player Classic, and ₹30.00 Crore for the 5-Player Mini Sprint.',
  },
  {
    q: 'What are the squad composition and overseas player limits?',
    a: 'Each franchise squad can hold a maximum of 25 players and must maintain at least 18 players. Out of the 25 squad members, a maximum of 8 overseas (international) players are allowed. In an active playing XI on match day, a maximum of 4 overseas players can be fielded.',
  },
  {
    q: 'What are the official paddle bid increments?',
    a: 'Bidding increments adhere to professional IPL auction standards: Under ₹5.00 Crore, every bid increases the price by ₹20 Lakhs (+₹0.20 Cr). Once the player reaches or crosses ₹5.00 Crore, the increment steps up to ₹25 Lakhs (+₹0.25 Cr) per paddle raise.',
  },
  {
    q: 'How does the Autonomous AI Bot Bidding Engine calculate bids?',
    a: 'Our proprietary bot valuation algorithm evaluates each player based on their T20 impact rating, set tier (Marquee, Capped Indian, Overseas Specialist, Uncapped), existing squad needs, and remaining purse capacity. Bots preserve mandatory budget for unfilled squad slots, hesitate realistically at high prices, and deploy clutch bids when rival bids stall.',
  },
  {
    q: 'How does the Offline / Hotspot Mode work without internet?',
    a: 'Offline / Hotspot Mode runs on an in-memory client engine and local network bridge. By connecting your friends to your phone hotspot or local Wi-Fi, auction room state synchronizes between your devices at sub-5ms LAN speed with zero mobile data consumed, zero Firebase RTDB quota, and zero cloud latency.',
  },
  {
    q: 'What happens if a player disconnects during a live auction?',
    a: 'The game uses real-time state synchronization. If a player refreshes their browser or briefly loses connection, they will seamlessly rejoin the live bidding room with the exact current purse and squad state intact.',
  },
  {
    q: 'Can I play solo against AI Bots?',
    a: 'Yes. Create a room, select your team, and click the "Fill bots" button at the top of the lobby. Smart AI franchise managers will immediately fill all remaining empty franchises with authentic bidding personalities.',
  },
  {
    q: 'Is CrickAuction completely free to play?',
    a: 'Yes! CrickAuction is a 100% free community cricket simulation platform. You can create unlimited cloud or local hotspot rooms, draft championship squads with friends, and export custom high-resolution squad cards with zero paywalls.',
  },
];

const STRATEGY_PLAYBOOKS = [
  {
    tag: 'Aggressive Spine',
    title: 'The Top-Heavy Marquee Strategy',
    teams: 'MI & RCB Archetype',
    desc: 'Commit 40–50% of the ₹120 Cr purse on 3–4 elite A-tier match winners (elite pacers, explosive openers, 360° finishers). Fill remaining slots with smart domestic uncapped scouting picks at base prices.',
    stat: '₹45–60 Cr on Top 4',
  },
  {
    tag: 'Balanced Spread',
    title: 'The Moneyball Depth Playbook',
    teams: 'KKR & RR Archetype',
    desc: 'Avoid price wars on ₹20+ Cr marquee stars. Instead, acquire 6–8 high-utility players in the ₹6–10 Cr bracket to construct balanced bowling partnerships, dual all-rounders, and versatile batting depth.',
    stat: '₹8–10 Cr Average Cost',
  },
  {
    tag: 'Spine & Spin Control',
    title: 'The Tactical Anchor Approach',
    teams: 'CSK & GT Archetype',
    desc: 'Prioritize experienced leadership, mystery spinners, and specialized death-overs bowlers. Retain purse flexibility to pounce on marquee players who slip into accelerated rounds at discounted rates.',
    stat: 'Sub-₹5 Cr Clutch Value',
  },
];

const GameGuide = () => {
  useDocumentTitle(
    'Rulebook & Game Guide | CrickAuction',
    'Comprehensive IPL Mega Auction 2026 rules, purse mathematics, atomic bidding increments, franchise playbooks, AI bot engine, and offline hotspot mode.'
  );

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
    { id: 'hotspot', label: '3. Offline / Hotspot mode' },
    { id: 'purse-rules', label: '4. Purse rules & bid tiers' },
    { id: 'playbooks', label: '5. Franchise playbooks' },
    { id: 'bots', label: '6. AI bot engine' },
    { id: 'faq', label: '7. FAQ' },
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
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10) {
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
      subtitle: 'Official IPL Regulations',
      budget: '₹120.0 Cr',
      squad: '18–25 players',
      overseas: '8 maximum',
      description: 'The authentic full IPL Mega Auction experience. Bid across all player pools (Marquee, Capped Indian, Overseas, Uncapped) to build a deep 25-man squad.',
    },
    {
      id: 'sprint11',
      title: '11-Player Classic',
      subtitle: 'Fast-Paced Competitive',
      budget: '₹60.0 Cr',
      squad: '11 players',
      overseas: '4 maximum',
      description: 'Quick competitive mode where each franchise drafts their playing XI directly without bench fillers, focusing on core balance and role symmetry.',
    },
    {
      id: 'sprint5',
      title: '5-Player Mini Sprint',
      subtitle: '10-Minute Lightning Battle',
      budget: '₹30.0 Cr',
      squad: '5 players',
      overseas: '2 maximum',
      description: 'Ultra-fast battle designed for rapid sessions. Target elite marquee superstars and key match-winners under a tight ₹30.0 Cr budget ceiling.',
    },
  ];

  const auctionSteps = [
    {
      step: '1',
      title: 'Create or join a room',
      desc: 'Host a fresh auction room or join using a 6-character room code (e.g. CRICK-8J1V or HOTSPOT-4K2M). Choose your preferred franchise crest and colors.',
    },
    {
      step: '2',
      title: 'Claim franchises & fill bots',
      desc: 'Each participant selects one of the 10 franchises. If you have open spots, the host can tap "Fill bots" to populate realistic AI bidders with distinct valuation models.',
    },
    {
      step: '3',
      title: 'Live paddle bidding & timer',
      desc: 'Players are presented one by one with star rating, role, and base price. Click "+ Bid" to raise the paddle. When the timer hits zero, the highest bidder secures the player.',
    },
    {
      step: '4',
      title: 'Roster & budget discipline',
      desc: 'Track your remaining purse and overseas player quota (max 8 in Mega Auction). Maintain enough remaining funds to satisfy mandatory minimum squad size requirements.',
    },
    {
      step: '5',
      title: 'Summary, ratings & squad cards',
      desc: 'When the auction concludes, inspect the final leaderboard, review squad ratings, and export high-resolution custom franchise squad cards to share with friends.',
    },
  ];

  const botFeatures = [
    {
      title: 'Smart Role & Tier Valuation Matrix',
      desc: 'Bots calculate maximum willingness-to-pay using player tier ratings, set multipliers (Marquee, International Finishers, Death Bowlers), and franchise squad composition needs.',
    },
    {
      title: 'Dynamic Minimum Slot Purse Protection',
      desc: 'The bot engine dynamically reserves mandatory minimum budget for each unfilled squad slot, preventing artificial bankruptcy and preserving cash for late uncapped rounds.',
    },
    {
      title: 'Human-Like Hesitation & Clutch Counter-Bids',
      desc: 'Bots introduce variable reaction delays (1.2s to 3.8s) and occasionally launch late clutch bids as the countdown clock approaches zero, replicating human auction room tension.',
    },
    {
      title: 'Overseas & Category Quota Compliance',
      desc: 'AI managers monitor strict 8-overseas maximum ceilings and prioritize balanced playing XI combinations (top-order, spin spine, pace battery, and wicketkeeper-batter).',
    },
  ];

  // Schema.org FAQPage structured data for Google Search rich snippets
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#0E0F10] text-[#E5E5E5] font-sans selection:bg-white/20 selection:text-white flex flex-col">
      {/* Search Engine FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0E0F10]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium tracking-wide">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
            <Home size={14} />
            <span>Home</span>
          </Link>
          <ChevronRight size={14} className="text-gray-600" />
          <span className="text-gray-500">Resources</span>
          <ChevronRight size={14} className="text-gray-600" />
          <span className="text-white">Rulebook & Guide</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/about"
            className="text-xs text-gray-400 hover:text-white transition-colors font-medium hidden sm:inline"
          >
            About Us
          </Link>
          <Link
            to="/"
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[#ff5500] hover:bg-[#ff6a1a] text-white transition-colors flex items-center gap-1.5"
          >
            <span>Play Now</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col lg:flex-row gap-8 lg:gap-24 items-start w-full flex-1">
        {/* Left TOC */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-28">
          <h3 className="text-white font-semibold text-sm mb-4">On this page</h3>
          <nav className="flex flex-col gap-2.5 border-l border-white/10">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`text-sm text-left pl-4 -ml-[1px] border-l ${
                  activeSection === s.id
                    ? 'border-[#ff5500] text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-white/30'
                } transition-colors`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-3xl w-full pb-20">
          <div className="mb-8 sm:mb-12 border-b border-white/10 pb-6 sm:pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff5500]/10 border border-[#ff5500]/30 text-[#ff5500] text-xs font-semibold uppercase tracking-wider mb-3">
              <BookOpen size={13} />
              <span>IPL Mega Auction 2026 Manual</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Rulebook & Gameplay Guide
            </h1>
            <p className="text-sm text-gray-500 mb-6">Last updated: October 2026 • Official Regulations</p>
            <p className="text-base text-[#E5E5E5] leading-relaxed">
              Master the mechanics, purse discipline, atomic bidding increments, franchise strategy archetypes, and autonomous AI engine that power the CrickAuction simulator.
            </p>
          </div>

          <details className="lg:hidden mb-8 border border-white/10 rounded-md p-4 bg-white/[0.01]">
            <summary className="cursor-pointer text-sm font-medium text-white">On this page</summary>
            <nav className="flex flex-col gap-2 mt-3 border-l border-white/10">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`text-sm text-left pl-3 -ml-[1px] border-l ${
                    activeSection === s.id ? 'border-[#ff5500] text-white' : 'border-transparent text-gray-400'
                  } transition-colors`}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </details>

          <div className="space-y-12 sm:space-y-16">
            
            {/* 1. Game Modes */}
            <section id="modes" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-2">1. Game modes</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Choose the auction format suited for your session length, group size, and tactical preferences.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {gameModes.map((mode) => (
                  <div key={mode.id} className="border border-white/10 rounded-md p-5 bg-white/[0.01] flex flex-col justify-between">
                    <div>
                      <div className="mb-4">
                        <h3 className="font-semibold text-white text-base">{mode.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{mode.subtitle}</p>
                      </div>

                      <div className="space-y-2 mb-4 text-xs font-mono">
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-gray-400">Purse</span>
                          <span className="text-[#ff5500] font-bold">{mode.budget}</span>
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
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. How to Play */}
            <section id="how-to-play" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-2">2. How to play</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Step-by-step walkthrough of hosting, joining, paddle raising, and finalizing rosters.
              </p>

              <div className="space-y-5">
                {auctionSteps.map((s) => (
                  <div key={s.step} className="flex gap-4 items-start border border-white/5 rounded-md p-4 bg-white/[0.01]">
                    <div className="w-7 h-7 shrink-0 rounded-full border border-white/15 flex items-center justify-center text-xs font-bold text-white bg-white/5 mt-0.5">
                      {s.step}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-1">{s.title}</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Offline / Hotspot Mode */}
            <section id="hotspot" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-2">3. Offline & Hotspot mode</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Host auctions anywhere without an active internet connection or external cloud database.
              </p>

              <div className="border border-white/10 rounded-md p-5 bg-white/[0.01] mb-4">
                <div className="flex items-center gap-2 mb-3 text-[#ff5500]">
                  <Wifi size={18} />
                  <h3 className="text-sm font-semibold text-white">Zero-Cloud Local Synchronisation</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Hotspot Mode runs on an in-memory client engine and local network bridge. Devices connected to the same phone hotspot or local Wi-Fi router synchronize bidding events directly at sub-5ms latency with zero mobile data consumption.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
                  <div className="p-3 rounded bg-white/[0.02] border border-white/5">
                    <span className="font-bold text-white block mb-1">Step 1: Enable Hotspot</span>
                    <span className="text-gray-400">Turn on personal hotspot on one phone or connect everyone to one Wi-Fi.</span>
                  </div>
                  <div className="p-3 rounded bg-white/[0.02] border border-white/5">
                    <span className="font-bold text-white block mb-1">Step 2: Host Room</span>
                    <span className="text-gray-400">On the home page, select "Hotspot Mode" to generate a HOTSPOT-XXXX room code.</span>
                  </div>
                  <div className="p-3 rounded bg-white/[0.02] border border-white/5">
                    <span className="font-bold text-white block mb-1">Step 3: Join & Draft</span>
                    <span className="text-gray-400">Other players open the site on their browser, enter the code, and bid with zero lag.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Purse Rules & Bid Tiers */}
            <section id="purse-rules" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-2">4. Purse rules & bid tiers</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Rules mirror official IPL Mega Auction guidelines for salary caps, minimum squads, and paddle increments.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="border border-white/10 rounded-md p-5 bg-white/[0.01]">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[#ff5500] flex items-center justify-center mb-3">
                    <Coins size={16} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1.5">₹120.0 Cr Purse Discipline</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-3">
                    Hard salary cap. Overspending early leaves franchises vulnerable during mandatory uncapped player rounds where bench depth is constructed.
                  </p>
                  <div className="text-[11px] font-mono text-gray-500 pt-2 border-t border-white/5 flex justify-between">
                    <span>Min Squad: 18</span>
                    <span className="text-white font-bold">Max Squad: 25</span>
                  </div>
                </div>

                <div className="border border-white/10 rounded-md p-5 bg-white/[0.01]">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                    <Users size={16} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1.5">8 Overseas Quota Limit</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-3">
                    International stars deliver explosive firepower but are strictly capped at 8 slots per squad. A maximum of 4 overseas players can be fielded in the playing XI.
                  </p>
                  <div className="text-[11px] font-mono text-gray-500 pt-2 border-t border-white/5 flex justify-between">
                    <span>Playing XI: Max 4</span>
                    <span className="text-white font-bold">Squad: Max 8</span>
                  </div>
                </div>

                <div className="border border-white/10 rounded-md p-5 bg-white/[0.01]">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                    <TrendingUp size={16} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1.5">Atomic Paddle Bid Tiers</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-3">
                    Bidding increments accelerate dynamically as valuation increases, simulating the real gavel atmosphere.
                  </p>
                  <div className="text-[11px] font-mono text-gray-500 pt-2 border-t border-white/5 flex justify-between">
                    <span>&lt; ₹5.00 Cr: +₹20L</span>
                    <span className="text-white font-bold">≥ ₹5.00 Cr: +₹25L</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Franchise Strategy Playbooks */}
            <section id="playbooks" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-2">5. Franchise bidding playbooks</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Proven team construction archetypes utilized by championship analysts.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {STRATEGY_PLAYBOOKS.map((strat, i) => (
                  <div
                    key={i}
                    className="border border-white/10 rounded-md p-5 bg-white/[0.01] flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-[#ff5500] tracking-wider block mb-1">
                        {strat.tag}
                      </span>
                      <h3 className="text-sm font-semibold text-white mb-0.5">
                        {strat.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 font-mono mb-3">
                        {strat.teams}
                      </p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {strat.desc}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-gray-500">Purse Allocation</span>
                      <span className="text-emerald-400 font-bold">{strat.stat}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 6. AI Bot Engine */}
            <section id="bots" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-2">6. Autonomous AI bot engine</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                When friends are unavailable, our proprietary bot algorithms step in with distinct bidding personas.
              </p>

              <div className="space-y-4">
                {botFeatures.map((f) => (
                  <div key={f.title} className="border-l-2 border-[#ff5500] pl-4 py-1">
                    <h3 className="text-sm font-medium text-white mb-1">{f.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 7. FAQ */}
            <section id="faq" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-2">7. Frequently asked questions</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Everything you need to know regarding auction rules, bots, technical synchronization, and costs.
              </p>

              <div className="border-t border-white/10">
                {FAQS.map((faq, idx) => (
                  <div key={idx} className="border-b border-white/10">
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full py-4 flex items-center justify-between text-left hover:text-white transition-colors text-[#E5E5E5] group cursor-pointer"
                    >
                      <span className="text-sm font-medium pr-4">{faq.q}</span>
                      <ChevronDown
                        size={16}
                        className={`text-gray-500 transition-transform duration-200 shrink-0 ${
                          openFaq === idx ? 'rotate-180 text-white' : 'group-hover:text-gray-400'
                        }`}
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
                          <div className="pb-4 text-xs sm:text-sm text-gray-400 leading-relaxed font-normal">
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
