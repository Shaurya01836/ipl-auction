import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Shield, Lock, Cookie, Eye, Mail } from 'lucide-react';
import Footer from '../components/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';

const PrivacyPolicy = () => {
  useDocumentTitle(
    'Privacy Policy | IPL Auction Simulator & Game',
    'Read the Privacy Policy for IPL Auction Simulator to understand how we handle user data, analytics, cookies, and privacy rights.'
  );

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#050505] flex flex-col items-center py-8 px-4 font-sans text-white overflow-x-hidden">
      {/* Subtle Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] bg-[#ff5500]/10 blur-[140px] rounded-full" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-600/5 blur-[140px] rounded-full" />
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
          IPL Hub Privacy Policy
        </span>

        <div className="w-[60px] sm:w-[85px]" />
      </header>

      {/* Hero Section */}
      <div className="w-full max-w-4xl text-center space-y-4 mb-8 sm:mb-12 z-10">
       
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
          Privacy Policy
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl mx-auto">
          Learn how the IPL Auction Simulator handles user data, real-time socket connections, Firebase Auth, and privacy-focused telemetry while you play live auctions with friends.
        </p>
      </div>

      {/* Main Content Container */}
      <main className="w-full max-w-4xl space-y-6 sm:space-y-8 z-10 mb-16">
        {/* Highlight Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-[#0a0a0b] border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-[#ff5500]/40 transition-all shadow-xl">
            <Lock className="w-6 h-6 text-[#ff5500] mb-2" />
            <h3 className="font-black uppercase tracking-wider text-white text-xs mb-1">No Passwords Saved</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">Authentication is managed directly via secure Google OAuth 2.0 & Firebase protocols.</p>
          </div>
          <div className="bg-[#0a0a0b] border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-amber-400/40 transition-all shadow-xl">
            <Cookie className="w-6 h-6 text-amber-400 mb-2" />
            <h3 className="font-black uppercase tracking-wider text-white text-xs mb-1">No Invasive Trackers</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">We only use local storage for volume, room preferences, and privacy-focused Umami analytics.</p>
          </div>
          <div className="bg-[#0a0a0b] border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-emerald-400/40 transition-all shadow-xl">
            <Eye className="w-6 h-6 text-emerald-400 mb-2" />
            <h3 className="font-black uppercase tracking-wider text-white text-xs mb-1">Zero Commercial Sale</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">Your telemetry, custom username, and auction bids are never sold or shared with third parties.</p>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-4 sm:space-y-6">
          <section className="bg-[#0a0a0b] border border-white/10 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 space-y-3 shadow-2xl">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-3">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/30 flex items-center justify-center text-xs font-black shrink-0">01</span>
              Information We Collect
            </h2>
            <div className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed space-y-2 sm:space-y-3">
              <p>When you join or host an auction room on <strong>crickauction.in</strong>, we collect minimal operational data:</p>
              <ul className="list-disc list-inside space-y-1.5 text-gray-400 pl-1">
                <li><strong className="text-white font-bold">Profile & Account:</strong> Google Account name, profile photo, and unique Firebase UID.</li>
                <li><strong className="text-white font-bold">Auction Real-Time Data:</strong> Lobby codes, player purse updates, bid history logs, squad compositions, and host settings.</li>
                <li><strong className="text-white font-bold">Telemetry:</strong> Anonymized screen resolution, browser version, and error traces monitored via privacy-compliant analytics.</li>
              </ul>
            </div>
          </section>

          <section className="bg-[#0a0a0b] border border-white/10 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 space-y-3 shadow-2xl">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-3">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/30 flex items-center justify-center text-xs font-black shrink-0">02</span>
              How We Process Information
            </h2>
            <div className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed space-y-2 sm:space-y-3">
              <p>Data collected is strictly used for:</p>
              <ul className="list-disc list-inside space-y-1.5 text-gray-400 pl-1">
                <li>Synchronizing live bidding turns and timer state across auction participants via Firebase Realtime Database.</li>
                <li>Saving auction summary leaderboards and generating downloadable squad cards.</li>
                <li>Preventing room spam, DDoS exploits, and maintaining platform stability.</li>
              </ul>
            </div>
          </section>

          <section className="bg-[#0a0a0b] border border-white/10 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 space-y-3 shadow-2xl">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-3">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/30 flex items-center justify-center text-xs font-black shrink-0">03</span>
              Local Storage & Preferences
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed">
              We store non-sensitive configuration keys in your browser's <code className="bg-white/10 px-2 py-0.5 rounded text-[#ff5500]">localStorage</code> (sound volume, cookie consent, active room history). You can clear this data at any time through your browser settings.
            </p>
          </section>

          <section className="bg-[#0a0a0b] border border-white/10 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 space-y-3 shadow-2xl">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-3">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/30 flex items-center justify-center text-xs font-black shrink-0">04</span>
              Contact & Support
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed">
              If you have any questions or data removal requests regarding this Privacy Policy, please contact our engineering team at:
            </p>
            <div className="inline-flex flex-wrap items-center gap-2.5 px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-[#ff5500] text-xs font-black uppercase tracking-wider">
              <Mail className="w-4 h-4 shrink-0" />
              <a href="mailto:shaurya01836@gmail.com" className="hover:underline break-all">shaurya01836@gmail.com</a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
