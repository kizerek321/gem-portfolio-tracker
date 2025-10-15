import React from 'react';
import { NavLink } from 'react-router-dom';

// Pro-tip: Replace the text spans with SVG icons for a more professional look.
const Sidebar = ({ onLogout }) => {
  const navLinkClasses = "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors duration-200";
  const activeLinkClasses = "bg-gray-700 text-white";

  return (
    <aside className="w-64 min-h-screen bg-gray-800 border-r border-gray-700 flex flex-col p-4">
      <div className="text-center py-4 mb-6">
        <h1 className="text-2xl font-display font-bold text-white tracking-wider">
          GEM Tracker
        </h1>
      </div>
      <nav className="flex-1 flex flex-col space-y-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
        >
          <span className="ml-3">Dashboard</span>
        </NavLink>
        <NavLink
          to="/about-strategy"
          className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
        >
          <span className="ml-3">About Strategy</span>
        </NavLink>
        <NavLink
          to="/about-author"
          className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
        >
          <span className="ml-3">About the Author</span>
        </NavLink>
      </nav>
      <div className="mt-auto">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center bg-brand-red/80 hover:bg-brand-red text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 shadow-lg"
        >
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;