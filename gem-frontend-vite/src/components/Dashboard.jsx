import React, { useState, useEffect } from 'react';
import { db, auth } from '/src/firebase/config.js'; // Import auth as well
import { collection, addDoc, query, onSnapshot } from "firebase/firestore";

// A small helper component for the calculating state
const CalculatingSpinner = () => (
  <td colSpan="5" className="text-center p-4">
    <div className="flex justify-center items-center text-gray-500">
      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Calculating current values...</span>
    </div>
  </td>
);

export const Dashboard = ({ user }) => {
  const [portfolio, setPortfolio] = useState([]); // Raw data from Firestore
  const [enrichedPortfolio, setEnrichedPortfolio] = useState([]); // Data with calculations
  const [loading, setLoading] = useState(true); // For initial Firestore load
  const [calculating, setCalculating] = useState(false); // For backend calculation load
  
  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('VT');

  // EFFECT 1: Fetch raw transactions from Firestore
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const userTransactionsRef = collection(db, "users", user.uid, "transactions");
    const q = query(userTransactionsRef);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactions = [];
      querySnapshot.forEach((doc) => {
        transactions.push({ id: doc.id, ...doc.data() });
      });
      setPortfolio(transactions);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // EFFECT 2: Fetch calculations from backend when portfolio changes
  useEffect(() => {
    const fetchCalculations = async () => {
      if (portfolio.length === 0 || !user) {
        setEnrichedPortfolio([]); // Clear enriched data if portfolio is empty
        return;
      }

      setCalculating(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch('http://127.0.0.1:8000/api/calculate-portfolio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(portfolio)
        });

        if (!response.ok) {
          throw new Error('Failed to fetch calculations from the backend.');
        }
        const calculatedData = await response.json();
        setEnrichedPortfolio(calculatedData);
      } catch (error) {
        console.error("Calculation error:", error);
        // If calculation fails, show the portfolio without the calculated values
        setEnrichedPortfolio(portfolio); 
      } finally {
        setCalculating(false);
      }
    };

    fetchCalculations();
  }, [portfolio, user]); // Rerun this effect when the raw portfolio or user changes

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    try {
      const userTransactionsRef = collection(db, "users", user.uid, "transactions");
      await addDoc(userTransactionsRef, { date, amount: Number(amount), asset });
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to add transaction. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Column 1: Add Transaction Form (No changes here) */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Add Transaction</h3>
          <form onSubmit={handleSubmit}>
             <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="date">Date</label>
              <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="amount">Amount (USD)</label>
              <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 500" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="asset">Asset</label>
              <select id="asset" value={asset} onChange={(e) => setAsset(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="VT">Global Equities (VT)</option>
                <option value="BND">Bonds (BND)</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Add to Portfolio</button>
          </form>
        </div>
      </div>

      {/* Column 2: Portfolio Display (Updated with live data) */}
      <div className="lg:col-span-2">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Your Portfolio</h3>
          <div className="overflow-x-auto">
            {loading ? <p>Loading portfolio...</p> : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Invested</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {calculating && <CalculatingSpinner />}
                  {!calculating && enrichedPortfolio.map(tx => {
                    const profitLoss = tx.profitLoss || 0;
                    const isProfit = profitLoss >= 0;
                    const profitColor = isProfit ? 'text-green-600' : 'text-red-600';
                    return (
                      <tr key={tx.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tx.asset}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${tx.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${tx.currentValue ? tx.currentValue.toFixed(2) : '...'}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${profitColor}`}>
                          {isProfit ? '+' : ''}${profitLoss.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {(!loading && portfolio.length === 0) && <p className="text-center text-gray-500 mt-4">Your portfolio is empty. Add your first transaction!</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

