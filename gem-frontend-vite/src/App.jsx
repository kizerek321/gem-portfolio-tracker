import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { auth } from '/src/firebase/config.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// --- New Layout Components ---
import Sidebar from './components/Sidebar.jsx';
import PublicHeader from './components/PublicHeader.jsx';
import Footer from './components/Footer.jsx';

// --- Page Components ---
import { AuthForm } from '/src/components/AuthForm.jsx';
import { Dashboard } from './components/Dashboard.jsx';
import AboutStrategy from './components/AboutStrategy.jsx';
import AboutAuthor from './components/AboutAuthor.jsx';
import PublicSignalView from './components/PublicSignalView.jsx';



const LoadingScreen = ({ message }) => (
  <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-gray-400">
    <svg className="animate-spin h-10 w-10 text-brand-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="mt-4 text-lg">{message}</p>
  </div>
);

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const handleLogout = () => {
    signOut(auth).then(() => navigate('/'));
  };

  if (authLoading) {
    return <LoadingScreen message="Authenticating..." />;
  }

  return (
    <div className="min-h-screen font-sans">
      {user ? (
        // --- AUTHENTICATED LAYOUT ---
        <div className="flex">
          <Sidebar onLogout={handleLogout} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-h-screen overflow-y-auto">
            <Routes>
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              <Route path="/about-strategy" element={<AboutStrategy />} />
              <Route path="/about-author" element={<AboutAuthor />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </main>
        </div>
      ) : (
        // --- PUBLIC LAYOUT ---
        <div className="flex flex-col min-h-screen">
          <PublicHeader />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <Routes>
                <Route path="/" element={<PublicSignalView />} />
                <Route path="/about-strategy" element={<AboutStrategy />} />
                <Route path="/about-author" element={<AboutAuthor />} />
                <Route path="/auth" element={<AuthForm />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
          </main>
          <Footer />
        </div>
      )}
    </div>
  );
}

export default App;