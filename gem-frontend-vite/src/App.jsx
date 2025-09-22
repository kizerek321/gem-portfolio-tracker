import React, { useState, useEffect, Fragment } from 'react';
import { auth } from '/src/firebase/config.js'; // FIX: Using absolute path from root
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { AuthForm } from '/src/components/AuthForm.jsx'; // FIX: Using absolute path from root
import { Dashboard } from './components/Dashboard.jsx';

// --- Helper Components for better UI structure ---

// A component to display a loading spinner
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center p-8 text-gray-500">
    <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="mt-4 text-lg">Fetching latest signal...</p>
  </div>
);

// A component to display an error message
const ErrorMessage = ({ message }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative max-w-md mx-auto" role="alert">
    <strong className="font-bold">Error: </strong>
    <span className="block sm:inline ml-1">{message}</span>
  </div>
);

// A component for the main card displaying the signal
const SignalCard = ({ data }) => {
  const isRiskOn = data.signal === data.risk_on_asset;
  const cardBgColor = isRiskOn ? 'bg-green-100' : 'bg-yellow-100';
  const textColor = isRiskOn ? 'text-green-800' : 'text-yellow-800';
  const borderColor = isRiskOn ? 'border-green-400' : 'border-yellow-400';
  const returnColor = data.vt_12m_return_pct > 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className={`w-full max-w-md mx-auto rounded-xl shadow-lg border ${borderColor} ${cardBgColor} p-6 sm:p-8 transition-all duration-300`}>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-500">Current GEM Signal</p>
        <h1 className={`text-5xl sm:text-6xl font-bold mt-2 ${textColor}`}>{data.recommended_asset}</h1>
        <p className="mt-1 text-gray-600">{isRiskOn ? "Invest in Global Equities" : "Retreat to Safety (Bonds)"}</p>
        <p>Asset to invest to based on GEM strategy: {data.recommended_asset}</p>
      </div>
      
      <div className="mt-8 border-t border-gray-300 pt-6 space-y-4">
        <div className="flex justify-between items-center text-sm">
          <p className="font-medium text-gray-700">Signal Date:</p>
          <p className="font-mono text-gray-900">{data.signal_date}</p>
        </div>
        <div className="flex justify-between items-center text-sm">
          <p className="font-medium text-gray-700">Current Price:</p>
          <p className="font-mono text-gray-900">{data.calculation_details.current_price}$</p>
        </div>
        <div className="flex justify-between items-center text-sm">
          <p className="font-medium text-gray-700">12M Lookback Date:</p>
          <p className="font-mono text-gray-900">{data.calculation_details.past_price_date}</p>
        </div>
        <div className="flex justify-between items-center text-sm">
          <p className="font-medium text-gray-700">12M Lookback Price:</p>
          <p className="font-mono text-gray-900">{data.calculation_details.past_price}$</p>
        </div>
        <div className="flex justify-between items-center text-lg">
          <p className="font-bold text-gray-700">12-Month Return:</p>
          <p className={`font-bold font-mono ${returnColor}`}>
            {(data.vt_12m_return_pct).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="text-center mt-8 text-xs text-gray-400">
        <p>Calculated based on the Global Equity Momentum (GEM) strategy.</p>
        
      </div>
    </div>
  );
};

const PublicSignalView = () => {
  const [signalData, setSignalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSignal = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/gem-signal');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setSignalData(data);
      } catch (e) {
        console.error("Failed to fetch GEM signal:", e);
        setError("Could not connect to the backend. Please ensure the Python server is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchSignal();
  }, []);

  if (loading) return <LoadingSpinner message="Fetching latest signal..." />;
  if (error) return <ErrorMessage message={error} />;
  return signalData && <SignalCard data={signalData} />;
}

// --- Main App Component ---
function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState('home'); // 'home' or 'auth'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setPage('dashboard'); // Or 'home' if you want logged-in users to see the signal first
      } else {
        setPage('home');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const handleLogout = () => {
    signOut(auth).catch(error => console.error("Logout error:", error));
    // The onAuthStateChanged listener will automatically set page to 'home'
  };

  const renderContent = () => {
    if (user) {
      // If the user is logged in, show the Dashboard.
      return <Dashboard user={user} />;
    } else {
      // If logged out, show either the home signal or the auth form.
      switch(page) {
        case 'auth':
          return <AuthForm />;
        case 'home':
        default:
          return <PublicSignalView />;
      }
    }
  };

  if (authLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Authenticating..." />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 font-sans min-h-screen relative p-4">
      {/* Button is now positioned relative to the whole screen */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        {user ? (
          <button 
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition shadow-md"
          >
            Logout
          </button>
        ) : (
          <button 
            onClick={() => setPage('auth')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition shadow-md"
          >
            Sign In / Register
          </button>
        )}
      </div>

      <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
        <header className="text-center py-6 w-full">
          <h1 
            className="text-2xl sm:text-3xl font-extrabold text-gray-800 cursor-pointer"
            onClick={() => setPage(user ? 'dashboard' : 'home')}
          >
            Global Equity Momentum
          </h1>
          <p className="text-lg text-gray-600 mt-2">A data-driven investment signal</p>
        </header>
        
        <main className="w-full mt-8">
          {renderContent()}
        </main>
      </div>

      <footer className="text-center mt-auto pt-12 text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} GEM Portfolio Tracker. For educational purposes only.</p>
      </footer>
    </div>
  );
}

export default App;