import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();
  const isAdmin = user && user.email && user.email.trim().toLowerCase() === import.meta.env.VITE_ADMIN_EMAIL?.trim().toLowerCase();

  return (
    <footer className="mt-16 sm:mt-32 w-full mx-auto border-t border-white/10 z-10 relative flex flex-col font-mono">
      <div className="w-full flex flex-col lg:flex-row text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gray-400">
        <div className="flex-1 px-4 sm:px-6 py-6 lg:py-4 flex items-center justify-center lg:justify-start border-b lg:border-b-0 border-white/10 text-center lg:text-left leading-relaxed">
          <span>© {currentYear} CRICK AUCTION. ALL RIGHTS RESERVED. CONCEPT CRAFTED BY <a href="https://ershaurya.dev" target="_blank" rel="noopener noreferrer" className="ml-1 hover:text-white transition-colors underline underline-offset-2">SHAURYA</a></span>
        </div>

        <div className="grid grid-cols-2 lg:flex lg:flex-row lg:flex-nowrap border-l-0 lg:border-l border-white/10 justify-center w-full lg:w-auto">
          <Link to="/guide" className="px-2 sm:px-6 py-4 hover:text-white hover:bg-white/5 transition-colors border-b lg:border-b-0 border-r border-white/10 flex items-center justify-center whitespace-nowrap">
            Game Guide
          </Link>
          <Link to="/privacy" className="px-2 sm:px-6 py-4 hover:text-white hover:bg-white/5 transition-colors border-b lg:border-b-0 lg:border-r border-white/10 flex items-center justify-center whitespace-nowrap">
            Privacy Policy
          </Link>
          <Link to="/terms" className={`px-2 sm:px-6 py-4 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center whitespace-nowrap border-white/10 ${isAdmin ? 'border-r' : 'col-span-2'}`}>
            Terms & Conditions
          </Link>
          {isAdmin && (
            <Link to="/admin" className="px-2 sm:px-6 py-4 text-[#ff5500] hover:bg-[#ff5500]/10 transition-colors flex items-center justify-center whitespace-nowrap border-white/10">
              Admin Dashboard
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
