import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Eye, Cookie, Mail, ChevronRight, Gavel } from 'lucide-react'
import { motion } from 'framer-motion'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Footer from '../components/Footer'

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useDocumentTitle(
    'Privacy Policy | IPL Auction Simulator & Game',
    'Read the Privacy Policy for IPL Auction Simulator to understand how we handle user data, analytics, cookies, and privacy rights.'
  )

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#ff5500] selection:text-black relative overflow-x-hidden">
      {/* Dynamic Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-orange-600/15 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      {/* Minimal Header with Back Button & Title */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative pt-6 sm:pt-10 pb-8 text-center max-w-4xl mx-auto px-4"
      >
        <div className="flex items-center justify-start mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#ff5500] group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </Link>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff5500]/10 border border-[#ff5500]/30 text-[#ff5500] text-xs font-black uppercase tracking-[0.2em] mb-4">
          <Shield className="w-4 h-4" /> Data Protection & Transparency
        </div>

        <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white mb-4">
          Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5500] via-amber-400 to-[#ffaa00]">Policy</span>
        </h1>

        <p className="text-gray-400 text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed">
          Learn how the IPL Auction Simulator handles user data, real-time socket connections, Firebase Auth, and privacy-focused telemetry while you play live auctions with friends.
        </p>
      </motion.div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 space-y-8 relative z-10">
        {/* Highlight Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0a0a0b] border border-white/10 rounded-2xl p-6 hover:border-[#ff5500]/40 transition-all shadow-xl">
            <Lock className="w-8 h-8 text-[#ff5500] mb-3" />
            <h3 className="font-black uppercase tracking-wider text-white text-sm mb-1">No Passwords Saved</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">Authentication is managed directly via secure Google OAuth 2.0 & Firebase protocols.</p>
          </div>
          <div className="bg-[#0a0a0b] border border-white/10 rounded-2xl p-6 hover:border-amber-400/40 transition-all shadow-xl">
            <Cookie className="w-8 h-8 text-amber-400 mb-3" />
            <h3 className="font-black uppercase tracking-wider text-white text-sm mb-1">No Invasive Trackers</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">We only use local storage for volume, room preferences, and privacy-focused Umami analytics.</p>
          </div>
          <div className="bg-[#0a0a0b] border border-white/10 rounded-2xl p-6 hover:border-emerald-400/40 transition-all shadow-xl">
            <Eye className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="font-black uppercase tracking-wider text-white text-sm mb-1">Zero Commercial Sale</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">Your telemetry, custom username, and auction bids are never sold or shared with third parties.</p>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">
          <section className="bg-[#0a0a0b] border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-4 shadow-2xl">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/30 flex items-center justify-center text-xs font-black">01</span>
              Information We Collect
            </h2>
            <div className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed space-y-3">
              <p>When you join or host an auction room on <strong>crickauction.in</strong>, we collect minimal operational data:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-400 pl-2">
                <li><strong className="text-white font-bold">Profile & Account:</strong> Google Account name, profile photo, and unique Firebase UID.</li>
                <li><strong className="text-white font-bold">Auction Real-Time Data:</strong> Lobby codes, player purse updates, bid history logs, squad compositions, and host settings.</li>
                <li><strong className="text-white font-bold">Telemetry:</strong> Anonymized screen resolution, browser version, and error traces monitored via privacy-compliant analytics.</li>
              </ul>
            </div>
          </section>

          <section className="bg-[#0a0a0b] border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-4 shadow-2xl">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/30 flex items-center justify-center text-xs font-black">02</span>
              How We Process Information
            </h2>
            <div className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed space-y-3">
              <p>Data collected is strictly used for:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-400 pl-2">
                <li>Synchronizing live bidding turns and timer state across auction participants via Firebase Realtime Database.</li>
                <li>Saving auction summary leaderboards and generating downloadable squad cards.</li>
                <li>Preventing room spam, DDoS exploits, and maintaining platform stability.</li>
              </ul>
            </div>
          </section>

          <section className="bg-[#0a0a0b] border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-4 shadow-2xl">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/30 flex items-center justify-center text-xs font-black">03</span>
              Local Storage & Cookie Preferences
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed">
              We store non-sensitive configuration keys in your browser's <code className="bg-white/10 px-2 py-0.5 rounded text-[#ff5500]">localStorage</code> (sound effects volume, cookie acceptance, active room history). You can clear this data at any time through your browser settings.
            </p>
          </section>

          <section className="bg-[#0a0a0b] border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-4 shadow-2xl">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/30 flex items-center justify-center text-xs font-black">04</span>
              Contact & Support
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed">
              If you have any questions or data removal requests regarding this Privacy Policy, please contact our engineering team at:
            </p>
            <div className="inline-flex items-center gap-3 px-5 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-[#ff5500] text-xs font-black uppercase tracking-widest">
              <Mail className="w-4 h-4" />
              <a href="mailto:support@crickauction.in" className="hover:underline">support@crickauction.in</a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
