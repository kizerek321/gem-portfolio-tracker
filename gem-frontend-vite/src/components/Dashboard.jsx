import React, { useState, useEffect, useMemo } from 'react';
import { db } from '/src/firebase/config.js';
import { collection, addDoc, query, onSnapshot, orderBy } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Import the new components
import KPICard from './KPICard.jsx';
import AddTransactionModal from './AddTransactionModal.jsx';

// --- Icon components for KPICards (replace with actual SVGs for better quality) ---
const ValueIcon = () => <span className="text-2xl">💰</span>;
const ProfitIcon = () => <span className="text-2xl">📈</span>;
const InvestedIcon = () => <span className="text-2xl">🏦</span>;

const CalculatingSpinner = () => (
    <div className="flex justify-center items-center text-gray-400">
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-brand-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Calculating...</span>
    </div>
);

export const Dashboard = ({ user }) => {
  const [portfolio, setPortfolio] = useState([]); // Raw data from Firestore
  const [enrichedPortfolio, setEnrichedPortfolio] = useState([]); // Data with calculations
  const [loading, setLoading] = useState(true); // For initial Firestore load
  const [calculating, setCalculating] = useState(false); // For backend calculation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState(null);

  // --- Data Fetching and Processing ---
  useEffect(() => {
    if (!user) return;
    const userTransactionsRef = collection(db, "users", user.uid, "transactions");
    const q = query(userTransactionsRef, orderBy("date", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPortfolio(transactions);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (portfolio.length === 0 || !user) {
      setEnrichedPortfolio([]);
      return;
    }
    const fetchCalculations = async () => {
      setCalculating(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/calculate-portfolio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(portfolio)
        });
        if (!response.ok) throw new Error('Backend calculation failed.');
        const calculatedData = await response.json();
        setEnrichedPortfolio(calculatedData);
      } catch (error) {
        console.error("Calculation error:", error);
        setEnrichedPortfolio(portfolio.map(tx => ({...tx, currentValue: tx.amount, profitLoss: 0})));
      } finally {
        setCalculating(false);
      }
    };
    fetchCalculations();
  }, [portfolio, user]);

  useEffect(() => {
    if (portfolio.length === 0 || !user) {
      setPortfolioHistory([]);
      setChartLoading(false);
      return;
    }
    const fetchPortfolioHistory = async () => {
      setChartLoading(true); 
      setChartError(null);   
      try {
        const token = await user.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/portfolio-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(portfolio)
        });
        if (!response.ok) throw new Error('Failed to fetch portfolio history from backend.');
        const historyData = await response.json();
        setPortfolioHistory(historyData);
      } catch (error) {
        console.error("Failed to fetch portfolio history:", error);
        setChartError(error.message); 
      } finally {
        setChartLoading(false); 
      }
    };
    fetchPortfolioHistory();
  }, [portfolio, user]);

  // --- Memoized Calculations for KPIs and Chart ---
  const { totalCurrentValue, totalInvested, totalProfitLoss, profitLossPct } = useMemo(() => {
    if (enrichedPortfolio.length === 0 || calculating) {
      return { totalCurrentValue: 0, totalInvested: 0, totalProfitLoss: 0, profitLossPct: 0 };
    }
    const totalInvested = enrichedPortfolio.reduce((sum, tx) => sum + tx.amount, 0);
    const totalCurrentValue = enrichedPortfolio.reduce((sum, tx) => sum + (parseFloat(tx.currentValue) || 0), 0);
    const totalProfitLoss = totalCurrentValue - totalInvested;
    const profitLossPct = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;
    return { totalCurrentValue, totalInvested, totalProfitLoss, profitLossPct };
  }, [enrichedPortfolio, calculating]);
  
  // --- Handlers ---
  const handleAddTransaction = async (transactionData) => {
    try {
      const userTransactionsRef = collection(db, "users", user.uid, "transactions");
      await addDoc(userTransactionsRef, transactionData);
      setIsModalOpen(false); // Close modal on success
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to add transaction.");
    }
  };

  const profitColor = totalProfitLoss >= 0 ? 'text-brand-green' : 'text-brand-red';

  return (
    <div className="space-y-8">
      {/* --- Header --- */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-display text-white">Dashboard</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-blue hover:bg-blue-500 text-white font-bold py-2 px-5 rounded-lg transition-colors shadow-lg"
        >
          + Add Transaction
        </button>
      </div>

      {/* --- KPI Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard title="Total Portfolio Value" value={`$${totalCurrentValue.toFixed(2)}`} icon={<ValueIcon />} isLoading={calculating} />
        <KPICard title="Total Profit / Loss" value={`${totalProfitLoss >= 0 ? '+' : ''}$${totalProfitLoss.toFixed(2)}`} change={`${profitLossPct.toFixed(2)}%`} changeColor={profitColor} icon={<ProfitIcon />} isLoading={calculating} />
        <KPICard title="Total Amount Invested" value={`$${totalInvested.toFixed(2)}`} icon={<InvestedIcon />} isLoading={loading} />
      </div>

      {/* --- Portfolio Chart --- */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg h-96">
        <h3 className="text-xl font-bold text-white mb-4">Portfolio History</h3>
        {chartLoading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
                <CalculatingSpinner /> <span className="ml-2">Loading Chart Data...</span>
            </div>
        )  : portfolioHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={portfolioHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
              <Legend />
              <Line type="monotone" dataKey="portfolioValue" name="Portfolio Value" stroke="#3B82F6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="totalInvested" name="Total Invested" stroke="#6B7280" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cumulativeProfit" name="Cumulative Profit" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ): chartError ? (
            <div className="flex items-center justify-center h-full text-red-400">
                <p>Could not load chart data. Please try again later.</p>
            </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Add transactions to see your portfolio chart.</p>
          </div>
        )}
      </div>

      {/* --- Portfolio Table --- */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
        <div className="p-6">
            <h3 className="text-xl font-bold text-white">Your Transactions</h3>
        </div>
        
        {/* --- Desktop Table (Hidden on mobile) --- */}
        <div className="overflow-x-auto hidden lg:block">
          {loading ? <p className="p-6 text-center text-gray-400">Loading portfolio...</p> : (
            <table className="min-w-full divide-y divide-gray-700">
              {/* ... (your existing <thead>) ... */}
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Asset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount Invested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Current Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Profit/Loss</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {enrichedPortfolio.map(tx => {
                  const profitLoss = parseFloat(tx.profitLoss) || 0;
                  const isProfit = profitLoss >= 0;
                  const plColorClass = isProfit ? 'bg-green-500/10 text-brand-green' : 'bg-red-500/10 text-brand-red';
                  return (
                    <tr key={tx.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{tx.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">{tx.asset}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">${Number(tx.amount).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                        {calculating ? <CalculatingSpinner /> : `$${(parseFloat(tx.currentValue) || 0).toFixed(2)}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {calculating ? '' : (
                          <span className={`px-3 py-1 rounded-full font-semibold text-xs ${plColorClass}`}>
                            {isProfit ? '+' : ''}${(profitLoss).toFixed(2)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* --- Mobile Card List (Hidden on desktop) --- */}
        <div className="lg:hidden p-4 space-y-4">
          {loading ? <p className="p-6 text-center text-gray-400">Loading portfolio...</p> : (
            enrichedPortfolio.map(tx => {
              const profitLoss = parseFloat(tx.profitLoss) || 0;
              const isProfit = profitLoss >= 0;
              const plColorClass = isProfit ? 'bg-green-500/10 text-brand-green' : 'bg-red-500/10 text-brand-red';
              const currentValue = parseFloat(tx.currentValue) || 0;

              return (
                <div key={tx.id} className="bg-gray-700/50 rounded-lg p-4 shadow-md border border-gray-600">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-mono text-xl font-bold text-white">{tx.asset}</span>
                    <span className="text-sm text-gray-400">{tx.date}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Invested:</span>
                      <span className="font-medium text-gray-300">${Number(tx.amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Current Value:</span>
                      <span className="font-semibold text-white">
                        {calculating ? '...' : `$${currentValue.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-600/50">
                      <span className="text-gray-400">Profit/Loss:</span>
                      {calculating ? (
                        <span className="text-sm text-gray-400">...</span>
                      ) : (
                        <span className={`px-3 py-1 rounded-full font-semibold text-xs ${plColorClass}`}>
                          {isProfit ? '+' : ''}${(profitLoss).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* --- Empty Portfolio Message --- */}
        {(!loading && portfolio.length === 0) && (
          <p className="text-center text-gray-500 p-8">Your portfolio is empty. Add your first transaction!</p>
        )}
      </div>

      {/* --- Add Transaction Modal --- */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTransaction}
        user={user}
      />
    </div>
  );
};