import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AuctionProvider } from './contexts/AuctionContext'
import LandingPage from './pages/LandingPage'
import AuctionRoom from './pages/AuctionRoom'
import Lobby from './pages/Lobby'
import './index.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <AuctionProvider>
          <div className="min-h-screen bg-ipl-dark text-white">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/lobby/:id" element={<Lobby />} />
              <Route path="/auction/:id" element={<AuctionRoom />} />
            </Routes>
          </div>
        </AuctionProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
