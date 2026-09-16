import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AuctionProvider } from './contexts/AuctionContext'
import { QuotaProvider } from './contexts/QuotaContext'
import QuotaExceededModal from './components/QuotaExceededModal'
import FeedbackModal from './components/FeedbackModal'
import LandingPage from './pages/LandingPage'
import AuctionRoom from './pages/AuctionRoom'
import AuctionSummary from './pages/AuctionSummary'
import './index.css'
import Lobby from './pages/Lobby'
import FantasyAdmin from './pages/FantasyAdmin'
import GameGuide from './pages/GameGuide'

function App() {
  return (
    <Router>
      <QuotaProvider>
        <AuthProvider>
          <AuctionProvider>
            <div className="min-h-screen bg-ipl-dark text-white">
              <QuotaExceededModal />
              <FeedbackModal />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/guide" element={<GameGuide />} />
                <Route path="/lobby/:id" element={<Lobby />} />
                <Route path="/auction/:id" element={<AuctionRoom />} />
                <Route path="/summary/:id" element={<AuctionSummary />} />
                <Route path="/admin/fantasy" element={<FantasyAdmin />} />
              </Routes>
            </div>
          </AuctionProvider>
        </AuthProvider>
      </QuotaProvider>
    </Router>
  )
}

export default App

