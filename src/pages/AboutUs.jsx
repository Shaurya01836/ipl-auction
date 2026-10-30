import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  ShieldCheck,
  Brain,
  Radio,
  Users,
  Award,
  BookOpen,
  ExternalLink,
  Code2,
  Cpu,
  Trophy,
  ArrowRight,
  Coins,
  Sparkles,
} from 'lucide-react';
import Footer from '../components/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';

const AboutUs = () => {
  useDocumentTitle(
    'About Us | CrickAuction — The Premier IPL Auction Simulator',
    'Learn about CrickAuction, our platform mission, AI bot valuation engine, local hotspot technology, and engineering standards.'
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [activeSection, setActiveSection] = useState('mission');

  const sections = [
    { id: 'mission', label: '1. Mission & Philosophy' },
    { id: 'architecture', label: '2. Simulation Architecture' },
    { id: 'hotspot', label: '3. Zero-Cloud Engineering' },
    { id: 'roster-rules', label: '4. Purse & Roster Integrity' },
    { id: 'creator', label: '5. Creator & Standards' },
    { id: 'disclaimer', label: '6. Non-Affiliation Disclaimer' },
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

  return (
    <div className="min-h-screen bg-[#0E0F10] text-[#E5E5E5] font-sans selection:bg-white/20 selection:text-white flex flex-col">
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
          <span className="text-white">About Us</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/guide"
            className="text-xs text-gray-400 hover:text-white transition-colors font-medium hidden sm:inline"
          >
            Rulebook & Guide
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
              <Award size={13} />
              <span>Platform Overview & Engineering</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              About CrickAuction
            </h1>
            <p className="text-sm text-gray-500 mb-6">Last updated: October 2026 • Platform Philosophy</p>
            <p className="text-base text-[#E5E5E5] leading-relaxed">
              CrickAuction is an advanced, real-time multiplayer cricket simulation platform crafted to recreate the strategic tension, purse management, and paddle battles of the official Indian Premier League (IPL) Mega Auction.
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
            
            {/* 1. Mission & Philosophy */}
            <section id="mission" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-2">1. Mission & Philosophy</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Why we built CrickAuction and how it bridges the gap between passive cricket viewing and tactical roster construction.
              </p>

              <div className="border border-white/10 rounded-md p-5 sm:p-6 bg-white/[0.01] space-y-4">
                <p className="text-sm text-gray-300 leading-relaxed font-normal">
                  Every year, millions of cricket enthusiasts worldwide watch team owners and analysts commit hundreds of crores at the IPL Mega Auction table. While fantasy leagues focus only on match points, the true foundation of every championship franchise is built in the auction hall—through purse discipline, smart scouting, role balancing, and bidding composure under time pressure.
                </p>
                <p className="text-sm text-gray-300 leading-relaxed font-normal">
                  CrickAuction was founded to make this tactical auction masterclass accessible to everyone. Whether you are hosting a high-stakes league with 9 friends or playing offline solo against our autonomous AI bot franchises, our simulator delivers realistic bidding dynamics, authentic purse mathematics, and instant feedback at professional esports standards.
                </p>
              </div>
            </section>

            {/* 2. Simulation Architecture */}
            <section id="architecture" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-2">2. Simulation Architecture</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Under the hood: multi-server realtime state distribution, sub-second bid resolution, and AI valuation mechanics.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-white/10 rounded-md p-5 bg-white/[0.01]">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[#ff5500] flex items-center justify-center mb-3">
                    <Brain size={16} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1.5">Autonomous AI Valuation</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Bots evaluate base prices, role multipliers, squad balance, and available purse capacity. AI franchises emulate human tension with dynamic hesitation and clutch bidding.
                  </p>
                </div>

                <div className="border border-white/10 rounded-md p-5 bg-white/[0.01]">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                    <Radio size={16} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1.5">Multi-Region Redundancy</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    State synchronization distributes bids across secondary Firebase instances and Supabase with automatic failover routing to maintain zero downtime.
                  </p>
                </div>

                <div className="border border-white/10 rounded-md p-5 bg-white/[0.01]">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                    <ShieldCheck size={16} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1.5">Deterministic Clock Offsets</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Time drift calibration guarantees that all 10 participants observe identical countdown tick intervals, preventing ping advantages on paddle raises.
                  </p>
                </div>

                <div className="border border-white/10 rounded-md p-5 bg-white/[0.01]">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                    <Users size={16} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1.5">Optimistic UI Reconciliation</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Immediate visual feedback on local paddle clicks with background authoritative confirmation ensures smooth gameplay even over variable mobile connections.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Hotspot & Zero-Cloud Engineering */}
            <section id="hotspot" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-2">3. Zero-Cloud Engineering</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Offline Hotspot mode delivers local-area network gaming without reliance on external cloud servers.
              </p>

              <div className="border border-white/10 rounded-md p-5 sm:p-6 bg-white/[0.01] space-y-4">
                <p className="text-sm text-gray-300 leading-relaxed">
                  Most modern multiplayer web applications rely exclusively on cloud databases like Firebase or WebSockets hosted on centralized servers. If internet connectivity drops, or cloud rate limits are reached, gameplay freezes.
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  To eliminate this dependency, CrickAuction includes an in-memory local network engine. By connecting to a shared mobile hotspot or local Wi-Fi router, participants synchronize state directly over LAN with sub-5ms latency and zero mobile data consumed. Once the auction concludes, squads can optionally be archived or exported as custom high-resolution cards.
                </p>
              </div>
            </section>

            {/* 4. Roster & Purse Accuracy */}
            <section id="roster-rules" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-2">4. Purse & Roster Integrity</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Accurate mathematical compliance with official BCCI regulations.
              </p>

              <div className="border border-white/10 rounded-md p-5 bg-white/[0.01]">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded bg-white/[0.02] border border-white/5">
                    <span className="font-mono text-[10px] text-gray-500 uppercase block mb-1">Salary Cap</span>
                    <span className="text-sm font-bold text-white block">₹120.00 Crore</span>
                    <span className="text-gray-400 text-[11px] mt-1 block">Scaled to ₹60 Cr / ₹30 Cr in sprint modes</span>
                  </div>

                  <div className="p-3 rounded bg-white/[0.02] border border-white/5">
                    <span className="font-mono text-[10px] text-gray-500 uppercase block mb-1">Squad Range</span>
                    <span className="text-sm font-bold text-white block">18 – 25 Players</span>
                    <span className="text-gray-400 text-[11px] mt-1 block">Hard ceiling of 8 overseas acquisitions</span>
                  </div>

                  <div className="p-3 rounded bg-white/[0.02] border border-white/5">
                    <span className="font-mono text-[10px] text-gray-500 uppercase block mb-1">Paddle Increments</span>
                    <span className="text-sm font-bold text-white block">+₹20L / +₹25L</span>
                    <span className="text-gray-400 text-[11px] mt-1 block">Dynamic tier upgrade once past ₹5.00 Cr</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Creator & Standards */}
            <section id="creator" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-2">5. Creator & Standards</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                The developer and engineering philosophy behind the project.
              </p>

              <div className="border border-white/10 rounded-md p-5 sm:p-6 bg-white/[0.01] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#ff5500] uppercase tracking-wider mb-2">
                    <Code2 size={14} />
                    <span>Lead Architect & Maintainer</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Shaurya Upadhyay
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-normal max-w-xl">
                    Software engineer and cricket simulation architect. CrickAuction is maintained with continuous roster revisions, performance profiling, and community-driven features to guarantee an authentic, transparent, and responsive simulator for cricket fans worldwide.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
                  <a
                    href="https://ershaurya.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all flex items-center justify-center gap-2"
                  >
                    <span>Portfolio</span>
                    <ExternalLink size={12} />
                  </a>
                  <a
                    href="https://github.com/shaurya-upadhyay/ipl-auction"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-md bg-[#ff5500] hover:bg-[#ff6a1a] text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(255,85,0,0.25)]"
                  >
                    <span>GitHub</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </section>

            {/* 6. Non-Affiliation Disclaimer */}
            <section id="disclaimer" className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-white mb-2">6. Non-Affiliation Disclaimer</h2>
              <div className="border border-white/10 rounded-md p-5 bg-white/[0.01] text-xs text-gray-400 leading-relaxed space-y-2">
                <p>
                  CrickAuction is an independent fan-created simulation project developed strictly for educational and entertainment purposes. CrickAuction is not affiliated with, endorsed by, or sponsored by the Board of Control for Cricket in India (BCCI), the Indian Premier League (IPL), or any participating franchise.
                </p>
                <p>
                  All franchise trademarks, team names, logos, player names, and associated likenesses remain the sole intellectual property of their respective rights holders.
                </p>
              </div>
            </section>

          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default AboutUs;
