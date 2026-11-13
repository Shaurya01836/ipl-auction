import React from 'react';
import { Link } from 'react-router-dom';
import GithubStarButton from './GithubStarButton';

const Navbar = () => {
  return (
    <header className="relative z-50 w-full bg-transparent border-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-13 sm:h-15 flex items-center justify-between">
        {/* Website Name and Favicon on the Left */}
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-2.5 font-pixel text-lg sm:text-xl md:text-2xl tracking-tight text-white select-none group"
          aria-label="CrickAuction Home"
        >
          <img
            src="/favicon.svg"
            alt="CrickAuction Cricket Ball"
            width="28"
            height="28"
            className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow-[0_2px_8px_rgba(220,38,38,0.4)] group-hover:rotate-12 transition-transform duration-300 shrink-0"
          />
          <span>CrickAuction</span>
        </Link>

        {/* Dedicated Space for GitHub Button on the Right */}
        <div className="flex items-center gap-3">
          <GithubStarButton />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
