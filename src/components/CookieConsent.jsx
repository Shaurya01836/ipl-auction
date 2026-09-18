import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Cookie, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent_status')
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie_consent_status', 'accepted')
    setIsVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('cookie_consent_status', 'declined')
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 left-4 right-4 sm:right-auto sm:left-6 sm:max-w-sm z-[100] pointer-events-auto"
        >
          <div className="bg-[#0a0a0b]/95 border border-white/10 backdrop-blur-2xl rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white relative flex flex-col gap-3">
            {/* Top Row: Icon, Title & Close */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#ff5500]/10 border border-[#ff5500]/30 rounded-lg text-[#ff5500]">
                  <Cookie className="w-4 h-4" />
                </div>
                <h4 className="font-black text-xs uppercase tracking-wider text-white">
                  Cookie & Privacy
                </h4>
              </div>
              <button
                onClick={handleDecline}
                className="text-gray-500 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                aria-label="Close cookie consent banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Minimal Description */}
            <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
              We use essential storage & telemetry to keep auction bids synced in real-time.{' '}
              <Link to="/privacy" className="text-gray-300 underline hover:text-[#ff5500] transition-colors">
                Privacy Policy
              </Link>
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={handleDecline}
                className="px-3 py-1.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-[11px] font-bold uppercase tracking-wider"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#ff5500] to-[#ff8c00] text-white text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1 shadow-[0_4px_15px_rgba(255,85,0,0.25)]"
              >
                <Check className="w-3.5 h-3.5" /> Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
