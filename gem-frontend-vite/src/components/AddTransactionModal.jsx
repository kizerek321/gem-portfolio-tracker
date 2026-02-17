import React, { useState, useEffect } from 'react';

const AddTransactionModal = ({ isOpen, onClose, onSubmit, user }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('IWDA.L');
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [isDateValid, setIsDateValid] = useState(false);

  useEffect(() => {
    if (!isOpen) return; // Don't validate when modal is closed

    const validateDate = async () => {
      setIsValidating(true);
      setValidationMessage('');
      setIsDateValid(false);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/validate-date`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asset, date })
        });
        const data = await response.json();
        if (data.isValid) {
          setIsDateValid(true);
          setValidationMessage('');
        } else {
          setValidationMessage('Market was closed. Please pick another date.');
        }
      } catch (error) {
        setValidationMessage('Could not validate date.');
      } finally {
        setIsValidating(false);
      }
    };
    validateDate();
  }, [date, asset, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ date, amount: Number(amount), asset });
    setAmount(''); // Reset form
    setDate(new Date().toISOString().split('T')[0]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md">
        <h3 className="text-2xl font-bold text-white mb-6">Add New Transaction</h3>
        <form onSubmit={handleSubmit}>
          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-400 mb-1">Date</label>
              <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-blue focus:outline-none" required />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">Amount (USD)</label>
              <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 500" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-blue focus:outline-none" required />
            </div>
            <div>
              <label htmlFor="asset" className="block text-sm font-medium text-gray-400 mb-1">Asset</label>
              <select id="asset" value={asset} onChange={(e) => setAsset(e.target.value)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-blue focus:outline-none">
                <option value="CBU0.L">CBU0.L</option>
                <option value="EIMI.L">EIMI.L</option>
                <option value="IB01.L">IB01.L</option>
                <option value="IWDA.L">IWDA.L</option>
              </select>
            </div>
          </div>
          {/* Validation & Buttons */}
          <div className="mt-6">
            {validationMessage && <p className="text-brand-red text-sm mb-2">{validationMessage}</p>}
            <div className="flex space-x-4">
              <button type="button" onClick={onClose} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={!isDateValid || isValidating} className="w-full bg-brand-blue hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isValidating ? 'Validating...' : 'Add Transaction'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;