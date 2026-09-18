import React from 'react'
import { Link } from 'react-router-dom'
import { Home, HelpCircle, Trophy, Gavel, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Footer from '../components/Footer'

export default function NotFound() {
  useDocumentTitle(
    'Page Not Found (404) | IPL Auction Simulator',
    'The page you are looking for does not exist or has been moved.'
  )

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#ff5500] selection:text-black flex flex-col justify-between relative overflow-x-hidden">
      {/* Dynamic Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-orange-600/15 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      {/* Main Content Card */}
      <div className="flex-1 flex items-center justify-center p-4 py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full bg-[#0a0a0b] border border-white/10 rounded-[2.5rem] p-8 text-center backdrop-blur-2xl shadow-2xl relative"
        >
          {/* Out of Bounds Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-black text-xs uppercase tracking-[0.2em] mb-6">
            <Trophy className="w-4 h-4 text-[#ff5500]" /> OUT OF BOUNDS!
          </div>

          {/* Big 404 Text */}
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff5500] via-amber-300 to-[#ffaa00] mb-2 tracking-tight">
            404
          </h1>

          <h2 className="text-xl font-black uppercase tracking-wider text-white mb-3">
            Unsold Route / Page Not Found
          </h2>

          <p className="text-gray-400 text-xs sm:text-sm font-medium leading-relaxed mb-8">
            This bid was rejected by the Third Umpire! The URL or lobby code you are looking for doesn't exist or has expired.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#ff5500] to-[#ff8c00] text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(255,85,0,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Home className="w-4 h-4" /> Return to Auction Hub
            </Link>

            <Link
              to="/guide"
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-white/[0.03] border border-white/10 text-gray-300 font-black text-xs uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
            >
              <HelpCircle className="w-4 h-4 text-[#ff5500]" /> Read Game Guide
            </Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
