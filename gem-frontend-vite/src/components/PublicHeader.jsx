import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PublicHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="py-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="flex justify-between items-center">
        <Link to="/" className="text-2xl font-display font-extrabold text-white">
          Global Equity Momentum
        </Link>

        {/* --- Desktop Nav (Hidden on mobile) --- */}
        <nav className="hidden md:flex items-center space-x-4 sm:space-x-6 text-sm sm:text-base font-medium">
          <NavLink
            to="/about-strategy"
            className={({ isActive }) => `text-gray-300 hover:text-white transition-colors ${isActive ? 'font-semibold text-white' : ''}`}
          >
            Strategy
          </NavLink>
          <NavLink
            to="/about-author"
            className={({ isActive }) => `text-gray-300 hover:text-white transition-colors ${isActive ? 'font-semibold text-white' : ''}`}
          >
            Author
          </NavLink>
          <Link to="/auth">
            <button className="bg-brand-blue hover:bg-blue-500 text-white font-bold py-2 px-5 rounded-lg transition-colors shadow-md">
              Sign In
            </button>
          </Link>
        </nav>

        {/* --- Mobile Hamburger Button (Hidden on desktop) --- */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-300 hover:text-white">
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* --- Mobile Menu (Fullscreen Overlay) --- */}
      <div 
        className={`fixed inset-0 bg-gray-900 p-4 z-50 transform ${isMenuOpen ? 'translate-y-0' : '-translate-y-full'} 
                    transition-transform duration-300 ease-in-out md:hidden`}
      >
        <div className="flex justify-between items-center mb-10">
          <span className="text-2xl font-display font-extrabold text-white">Menu</span>
          <button onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-white">
            <CloseIcon />
          </button>
        </div>
        <nav className="flex flex-col space-y-6 text-center">
          <NavLink
            to="/about-strategy"
            onClick={() => setIsMenuOpen(false)}
            className="text-2xl text-gray-300 hover:text-white"
          >
            Strategy
          </NavLink>
          <NavLink
            to="/about-author"
            onClick={() => setIsMenuOpen(false)}
            className="text-2xl text-gray-300 hover:text-white"
          >
            Author
          </NavLink>
          <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
            <button className="w-full bg-brand-blue hover:bg-blue-500 text-white font-bold py-4 px-5 rounded-lg transition-colors shadow-md text-xl">
              Sign In / Register
            </button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default PublicHeader;