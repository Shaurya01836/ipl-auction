import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AuctionProvider } from './contexts/AuctionContext'
import { QuotaProvider } from './contexts/QuotaContext'
import ScrollToTop from './components/ScrollToTop'
import LandingPage from './pages/LandingPage'
import './index.css'

// ── Lazy-loaded routes (split out of the initial bundle) ──────────────────────
const AuctionRoom     = lazy(() => import('./pages/AuctionRoom'))
const AuctionSummary  = lazy(() => import('./pages/AuctionSummary'))
const Lobby           = lazy(() => import('./pages/Lobby'))
const GameGuide       = lazy(() => import('./pages/GameGuide'))
const PrivacyPolicy   = lazy(() => import('./pages/PrivacyPolicy'))
const TermsConditions = lazy(() => import('./pages/TermsConditions'))
const AdminPanel      = lazy(() => import('./pages/AdminPanel'))
const NotFound        = lazy(() => import('./pages/NotFound'))

// ── Lazy-loaded heavy modals (defer until after first paint) ──────────────────
const QuotaExceededModal = lazy(() => import('./components/QuotaExceededModal'))
const FeedbackModal      = lazy(() => import('./components/FeedbackModal'))
const CookieConsent      = lazy(() => import('./components/CookieConsent'))

// ── Minimal inline fallback — no extra bundle cost ───────────────────────────
const PageFallback = () => (
  <div className="min-h-screen bg-[#050505] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
  </div>
)

function App() {
  return (
    <Router>
      <ScrollToTop />
      <QuotaProvider>
        <AuthProvider>
          <AuctionProvider>
            <div className="min-h-screen bg-ipl-dark text-white">
              {/* Modals are not needed on first paint — lazy load them */}
              <Suspense fallback={null}>
                <QuotaExceededModal />
                <FeedbackModal />
                <CookieConsent />
              </Suspense>

              <Routes>
                {/* LandingPage is eagerly loaded — it IS the first paint */}
                <Route path="/" element={<LandingPage />} />

                {/* All other routes are code-split into separate chunks */}
                <Route path="/admin" element={
                  <Suspense fallback={<PageFallback />}><AdminPanel /></Suspense>
                } />
                <Route path="/admin/:tab" element={
                  <Suspense fallback={<PageFallback />}><AdminPanel /></Suspense>
                } />
                <Route path="/guide" element={
                  <Suspense fallback={<PageFallback />}><GameGuide /></Suspense>
                } />
                <Route path="/privacy" element={
                  <Suspense fallback={<PageFallback />}><PrivacyPolicy /></Suspense>
                } />
                <Route path="/terms" element={
                  <Suspense fallback={<PageFallback />}><TermsConditions /></Suspense>
                } />
                <Route path="/lobby/:id" element={
                  <Suspense fallback={<PageFallback />}><Lobby /></Suspense>
                } />
                <Route path="/auction/:id" element={
                  <Suspense fallback={<PageFallback />}><AuctionRoom /></Suspense>
                } />
                <Route path="/summary/:id" element={
                  <Suspense fallback={<PageFallback />}><AuctionSummary /></Suspense>
                } />
                <Route path="*" element={
                  <Suspense fallback={<PageFallback />}><NotFound /></Suspense>
                } />
              </Routes>
            </div>
          </AuctionProvider>
        </AuthProvider>
      </QuotaProvider>
    </Router>
  )
}

export default App
