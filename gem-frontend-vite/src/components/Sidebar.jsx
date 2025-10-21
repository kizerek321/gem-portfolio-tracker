import React from 'react';
import { NavLink } from 'react-router-dom';

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Sidebar = ({ onLogout, isOpen, setIsOpen }) => {
  const navLinkClasses = "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors duration-200";
  const activeLinkClasses = "bg-gray-700 text-white";

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-30 lg:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsOpen(false)}
      ></div>
      <aside 
        className={`w-64 min-h-screen bg-gray-800 border-r border-gray-700 flex flex-col p-4 
                   fixed inset-y-0 left-0 z-40 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                   transition-transform duration-300 ease-in-out 
                   lg:relative lg:translate-x-0 lg:z-auto`}
      >
        <div className="flex justify-between items-center py-4 mb-6">
          <NavLink to="/" className="text-2xl font-display font-bold text-white tracking-wider">
            GEM Tracker
          </NavLink>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <CloseIcon />
          </button>
        </div>
        
        <nav className="flex-1 flex flex-col space-y-2">
          <NavLink
            to="/dashboard"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
          >
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/about-strategy"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
          >
            <span>About Strategy</span>
          </NavLink>
          <NavLink
            to="/about-author"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
          >
            <span>About the Author</span>
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
    </>
  );
};

export default Sidebar;