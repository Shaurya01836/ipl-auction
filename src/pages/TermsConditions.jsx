import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Scale, AlertTriangle, HelpCircle } from 'lucide-react';
import Footer from '../components/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';

const TermsConditions = () => {
  useDocumentTitle(
    'Terms & Conditions | IPL Auction Simulator & Game',
    'Review the Terms and Conditions of IPL Auction Simulator. Rules, fair play guidelines, IP disclaimers, and virtual currency policies.'
  );

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#050505] flex flex-col items-center py-8 px-4 font-sans text-white overflow-x-hidden">
      {/* Subtle Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] bg-blue-600/10 blur-[140px] rounded-full" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-[#ff5500]/5 blur-[140px] rounded-full" />
      </div>

      {/* Navigation Header (Matching Game Guide) */}
      <header className="w-full max-w-5xl flex items-center justify-between gap-3 mb-8 sm:mb-12 z-20 px-1 sm:px-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 sm:px-4 sm:py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl sm:rounded-2xl transition-all group flex items-center gap-2 cursor-pointer"
        >
          <Home size={14} className="text-gray-400 group-hover:text-white transition-colors sm:w-[16px] sm:h-[16px]" />
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Home</span>
        </button>

        <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-gray-400 text-center truncate px-2">
          IPL Hub Terms of Service
        </span>

        <div className="w-[60px] sm:w-[85px]" />
      </header>

      {/* Hero Section */}
      <div className="w-full max-w-4xl text-center space-y-4 mb-8 sm:mb-12 z-10">
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
          Terms & Conditions
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl mx-auto">
          Please review the rules of conduct, virtual purse guidelines, and fan-made IP disclaimers before hosting live IPL Mega Auctions on our platform.
        </p>
      </div>

      {/* Main Content Container */}
      <main className="w-full max-w-4xl space-y-6 sm:space-y-8 z-10 mb-16">
        {/* Important Disclaimer Card */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 flex flex-col sm:flex-row items-start gap-3.5 sm:gap-4 shadow-2xl backdrop-blur-xl">
          <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h3 className="font-black uppercase tracking-wider text-amber-300 text-xs sm:text-sm">Fan-Made Simulation & Non-Affiliation Disclaimer</h3>
            <p className="text-xs text-gray-300 font-medium leading-relaxed">
              IPL Auction Simulator (crickauction.in) is a free, non-commercial fan simulation game created purely for entertainment and strategy practice. We are <strong>not affiliated with, endorsed by, or associated with</strong> the Board of Control for Cricket in India (BCCI), the Indian Premier League (IPL), or any official franchise team. All team names, logos, and trademarks belong to their respective owners.
            </p>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-4 sm:space-y-6">
          <section className="bg-[#0a0a0b] border border-white/10 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 space-y-3 shadow-2xl">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-3">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/20 text-cyan-400 border border-blue-500/30 flex items-center justify-center text-xs font-black shrink-0">01</span>
              Acceptance of Terms
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed">
              By accessing or playing IPL Auction Simulator, you agree to comply with and be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the service.
            </p>
          </section>

          <section className="bg-[#0a0a0b] border border-white/10 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 space-y-3 shadow-2xl">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-3">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/20 text-cyan-400 border border-blue-500/30 flex items-center justify-center text-xs font-black shrink-0">02</span>
              Virtual Purse & No Real Money Policy
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed">
              All monetary values, team purse budgets (e.g., ₹120 Crore), player valuations, and bid increments represent <strong>strictly virtual points</strong>. No real money is deposited, earned, wagered, or paid out under any circumstances.
            </p>
          </section>

          <section className="bg-[#0a0a0b] border border-white/10 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 space-y-3 shadow-2xl">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-3">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/20 text-cyan-400 border border-blue-500/30 flex items-center justify-center text-xs font-black shrink-0">03</span>
              Fair Play & User Conduct
            </h2>
            <div className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed space-y-2 sm:space-y-3">
              <p>To keep the platform competitive and fun for all players, users agree not to:</p>
              <ul className="list-disc list-inside space-y-1.5 text-gray-400 pl-1">
                <li>Use automated scripts, bots, or browser hacks to bypass bidding countdown timers.</li>
                <li>Enter offensive, abusive, or hate speech into custom room names or manager handles.</li>
                <li>Attempt to overload, DDOS, or reverse-engineer real-time backend database endpoints.</li>
                <li>Impersonate administrators, organizers, or other players.</li>
              </ul>
            </div>
          </section>

          <section className="bg-[#0a0a0b] border border-white/10 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 space-y-3 shadow-2xl">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-3">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/20 text-cyan-400 border border-blue-500/30 flex items-center justify-center text-xs font-black shrink-0">04</span>
              Service Availability & Support
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed">
              We reserve the right to modify or update game parameters at any time. For questions regarding terms or licensing concerns, please contact:
            </p>
            <div className="inline-flex flex-wrap items-center gap-2.5 px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-cyan-400 text-xs font-black uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <a href="mailto:shaurya01836@gmail.com" className="hover:underline break-all">shaurya01836@gmail.com</a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsConditions;
