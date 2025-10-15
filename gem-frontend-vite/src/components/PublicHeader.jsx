import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const PublicHeader = () => {
  return (
    <header className="py-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center">
        <Link to="/" className="text-2xl font-display font-extrabold text-white">
          Global Equity Momentum
        </Link>
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
      </div>
    </header>
  );
};

export default PublicHeader;