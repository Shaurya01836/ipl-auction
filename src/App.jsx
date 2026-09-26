import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AuctionProvider } from './contexts/AuctionContext'
import { QuotaProvider } from './contexts/QuotaContext'
import QuotaExceededModal from './components/QuotaExceededModal'
import FeedbackModal from './components/FeedbackModal'
import CookieConsent from './components/CookieConsent'
import ScrollToTop from './components/ScrollToTop'
import LandingPage from './pages/LandingPage'
import AuctionRoom from './pages/AuctionRoom'
import AuctionSummary from './pages/AuctionSummary'
import Lobby from './pages/Lobby'
import GameGuide from './pages/GameGuide'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsConditions from './pages/TermsConditions'
import AdminPanel from './pages/AdminPanel'
import NotFound from './pages/NotFound'
import './index.css'

function App() {
  return (
    <Router>
      <ScrollToTop />
      <QuotaProvider>
        <AuthProvider>
          <AuctionProvider>
            <div className="min-h-screen bg-ipl-dark text-white">
              <QuotaExceededModal />
              <FeedbackModal />
              <CookieConsent />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/admin/:tab" element={<AdminPanel />} />
                <Route path="/guide" element={<GameGuide />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsConditions />} />
                <Route path="/lobby/:id" element={<Lobby />} />
                <Route path="/auction/:id" element={<AuctionRoom />} />
                <Route path="/summary/:id" element={<AuctionSummary />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </AuctionProvider>
        </AuthProvider>
      </QuotaProvider>
    </Router>
  )
}

export default App

