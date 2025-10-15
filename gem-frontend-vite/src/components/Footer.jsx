import React from 'react';

const Footer = () => {
  return (
    <footer className="text-center py-8 mt-12 text-gray-500 text-sm border-t border-gray-800">
      <p>&copy; {new Date().getFullYear()} GEM Portfolio Tracker. For educational purposes only.</p>
      <p className="mt-1">Not financial advice. All data is provided for informational purposes.</p>
    </footer>
  );
};

export default Footer;