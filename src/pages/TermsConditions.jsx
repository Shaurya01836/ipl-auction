import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Scale, AlertTriangle, HelpCircle, Gavel, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Footer from '../components/Footer'

export default function TermsConditions() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useDocumentTitle(
    'Terms & Conditions | IPL Auction Simulator & Game',
    'Review the Terms and Conditions of IPL Auction Simulator. Rules, fair play guidelines, IP disclaimers, and virtual currency policies.'
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

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-4">
          <Scale className="w-4 h-4" /> Platform Usage & Gameplay Agreement
        </div>

        <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white mb-4">
          Terms & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-400">Conditions</span>
        </h1>

        <p className="text-gray-400 text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed">
          Please review the rules of conduct, virtual purse guidelines, and fan-made IP disclaimers before hosting live IPL Mega Auctions on our platform.
        </p>
      </motion.div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 space-y-8 relative z-10">
        {/* Important Disclaimer Card */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-4 shadow-2xl backdrop-blur-xl">
          <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0 mt-1" />
          <div className="space-y-2">
            <h3 className="font-black uppercase tracking-wider text-amber-300 text-sm sm:text-base">Fan-Made Simulation & Non-Affiliation Disclaimer</h3>
            <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed">
              IPL Auction Simulator (crickauction.in) is a free, non-commercial fan simulation game created purely for entertainment and strategy practice. We are <strong>not affiliated with, endorsed by, or associated with</strong> the Board of Control for Cricket in India (BCCI), the Indian Premier League (IPL), or any official franchise team. All team names, logos, and trademarks belong to their respective owners.
            </p>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          <section className="bg-[#0a0a0b] border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-4 shadow-2xl">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-blue-500/20 text-cyan-400 border border-blue-500/30 flex items-center justify-center text-xs font-black">01</span>
              Acceptance of Platform Terms
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed">
              By accessing or playing IPL Auction Simulator, you agree to comply with and be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the service.
            </p>
          </section>

          <section className="bg-[#0a0a0b] border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-4 shadow-2xl">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-blue-500/20 text-cyan-400 border border-blue-500/30 flex items-center justify-center text-xs font-black">02</span>
              Virtual Purse & No Real Money Policy
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed">
              All monetary values, team purse budgets (e.g., ₹120 Crore), player valuations, and bid increments represent <strong>strictly virtual points</strong>. No real money is deposited, earned, wagered, or paid out under any circumstances.
            </p>
          </section>

          <section className="bg-[#0a0a0b] border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-4 shadow-2xl">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-blue-500/20 text-cyan-400 border border-blue-500/30 flex items-center justify-center text-xs font-black">03</span>
              Fair Play & User Conduct
            </h2>
            <div className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed space-y-3">
              <p>To keep the platform competitive and fun for all players, users agree not to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-400 pl-2">
                <li>Use automated scripts, bots, or browser hacks to bypass bidding countdown timers.</li>
                <li>Enter offensive, abusive, or hate speech into custom room names or manager handles.</li>
                <li>Attempt to overload, DDOS, or reverse-engineer real-time backend database endpoints.</li>
                <li>Impersonate administrators, organizers, or other players.</li>
              </ul>
            </div>
          </section>

          <section className="bg-[#0a0a0b] border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-4 shadow-2xl">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-blue-500/20 text-cyan-400 border border-blue-500/30 flex items-center justify-center text-xs font-black">04</span>
              Service Availability & Support
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed">
              We reserve the right to modify or update game parameters at any time. For questions regarding terms or licensing concerns, please contact:
            </p>
            <div className="inline-flex items-center gap-3 px-5 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-cyan-400 text-xs font-black uppercase tracking-widest">
              <HelpCircle className="w-4 h-4" />
              <a href="mailto:support@crickauction.in" className="hover:underline">support@crickauction.in</a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
