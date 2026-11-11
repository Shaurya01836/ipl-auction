import React from 'react';
import { Link } from 'react-router-dom';
import GithubStarButton from './GithubStarButton';

const Navbar = () => {
  return (
    <header className="relative z-50 w-full bg-transparent border-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-13 sm:h-15 flex items-center justify-between">
        {/* Website Name on the Left */}
        <Link
          to="/"
          className="font-pixel text-lg sm:text-xl md:text-2xl tracking-tight text-white select-none"
          aria-label="CrickAuction Home"
        >
          CrickAuction
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
