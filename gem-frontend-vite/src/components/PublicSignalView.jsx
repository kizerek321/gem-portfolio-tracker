import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// --- Reusable UI Components (You can move these to a separate file later) ---
const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-400">
        <svg className="animate-spin h-10 w-10 text-brand-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg">Fetching latest signal...</p>
    </div>
);

const ErrorMessage = ({ message }) => (
    <div className="bg-red-900/50 border border-brand-red text-red-300 px-4 py-3 rounded-lg relative max-w-lg mx-auto" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline ml-1">{message}</span>
    </div>
);

// --- Metric Card Component for the Dashboard ---
const MetricCard = ({ title, value, subValue, valueColor = 'text-white' }) => (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <p className={`text-3xl font-bold mt-2 ${valueColor}`}>{value}</p>
        {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
    </div>
);

// --- Main Component ---
const PublicSignalView = () => {
    const [signalData, setSignalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSignal = async () => {
            try {
                // Fetch data from your backend API
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/gem-signal`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (data.error) {
                    throw new Error(data.error);
                }
                setSignalData(data);
            } catch (e) {
                console.error("Failed to fetch GEM signal:", e);
                setError("Could not connect to the backend. Please check the server and try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchSignal();
    }, []);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!signalData) return <ErrorMessage message="No signal data is available at the moment." />;

    const isRiskOn = signalData.signal === signalData.risk_on_asset;
    const returnPct = parseFloat(signalData.vt_12m_return_pct);
    const returnColor = returnPct >= 0 ? 'text-brand-green' : 'text-brand-red';

    return (
        <div className="space-y-16 py-8">
            {/* --- Section 1: The Main Signal Hub --- */}
            <section className="text-center">
                <div className={`py-12 px-6 rounded-2xl ${isRiskOn ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                    <h1 className={`text-6xl sm:text-7xl font-display font-extrabold ${isRiskOn ? 'text-brand-green' : 'text-brand-blue'}`}>
                        {isRiskOn ? 'RISK ON' : 'RISK OFF'}
                    </h1>
                    <p className="mt-4 text-xl text-gray-300">
                        Strategy Recommends: <span className="font-bold text-white">{isRiskOn ? 'Global Equities' : 'Safe Bonds'} ({signalData.recommended_asset})</span>
                    </p>
                </div>
            </section>

            {/* --- Section 2: Key Metrics Dashboard --- */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                    title="12-Month Return"
                    value={`${returnPct.toFixed(2)}%`}
                    subValue="The key momentum indicator"
                    valueColor={returnColor}
                />
                <MetricCard 
                    title="Signal Checked On"
                    value={new Date(signalData.signal_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    subValue="Signals are checked daily"
                />
                 <MetricCard 
                    title="Current Price"
                    value={`$${parseFloat(signalData.calculation_details.current_price).toFixed(2)}`}
                    subValue={`Lookback Price: $${parseFloat(signalData.calculation_details.past_price).toFixed(2)}`}
                />
            </section>
            
            {/* --- Section 3: "How It Works" Visual Summary --- */}
            <section className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
                <h2 className="text-3xl font-display font-bold text-center text-white mb-8">How The Strategy Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="flex flex-col items-center">
                        <div className="bg-gray-700 p-4 rounded-full mb-4">
                           {/* Replace with an SVG icon */}
                           <span className="text-3xl">📊</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white">1. Analyze</h3>
                        <p className="text-gray-400 mt-2">We measure the 12-month total return of a global stock market ETF.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="bg-gray-700 p-4 rounded-full mb-4">
                            <span className="text-3xl">🧭</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white">2. Decide</h3>
                        <p className="text-gray-400 mt-2">If the return is positive, the signal is "Risk On". If not, it's "Risk Off".</p>
                    </div>
                    <div className="flex flex-col items-center">
                         <div className="bg-gray-700 p-4 rounded-full mb-4">
                           <span className="text-3xl">🚀</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white">3. Act</h3>
                        <p className="text-gray-400 mt-2">Invest in global equities during "Risk On" and switch to bonds for "Risk Off".</p>
                    </div>
                </div>
            </section>

            {/* --- Section 4: Call to Action --- */}
            <section className="text-center py-10">
                <h2 className="text-3xl font-display font-bold text-white">Ready to Take Control?</h2>
                <p className="max-w-2xl mx-auto mt-3 text-gray-400">
                    Stop guessing and start using a data-driven strategy. Sign up for free to track your own portfolio against the GEM signal.
                </p>
                <Link to="/auth">
                    <button className="mt-8 bg-brand-blue hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                        Start Tracking Your Portfolio
                    </button>
                </Link>
            </section>
        </div>
    );
};

export default PublicSignalView;