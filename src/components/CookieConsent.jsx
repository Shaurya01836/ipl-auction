import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Cookie, X } from 'lucide-react'
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
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 sm:bottom-6 left-3 right-3 sm:right-auto sm:left-6 sm:max-w-sm z-[100] pointer-events-auto transform-gpu"
        >
          <div className="bg-[#0c0d10]/95 border border-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] text-white relative flex flex-col gap-3">
            {/* Top Row: Icon, Title & Close */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-300">
                  <Cookie className="w-4 h-4" />
                </div>
                <h4 className="font-pixel text-[11px] uppercase tracking-wider text-white">
                  Cookie & Privacy
                </h4>
              </div>
              <button
                type="button"
                onClick={handleDecline}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors active:scale-95"
                aria-label="Close cookie consent banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              We use essential local storage to keep auction bids synced in real time.{' '}
              <Link to="/privacy" className="text-white underline underline-offset-2 hover:text-slate-300 transition-colors">
                Privacy Policy
              </Link>
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleDecline}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all text-xs font-bold uppercase tracking-wider active:scale-[0.98]"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-black text-xs font-bold uppercase tracking-wider active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(255,255,255,0.08)]"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
