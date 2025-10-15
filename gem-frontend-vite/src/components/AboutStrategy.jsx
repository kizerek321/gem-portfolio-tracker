import React from 'react';

// --- Simple SVG Icon Components (can be moved to a separate file) ---
const RelativeMomentumIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const AbsoluteMomentumIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const AboutStrategy = () => {
  return (
    <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-700 max-w-4xl mx-auto text-gray-300 leading-relaxed">
      <h1 className="text-4xl font-display font-bold text-white mb-4 text-center">
        Global Equity Momentum (GEM)
      </h1>
      <p className="text-lg text-center text-gray-400 mb-8">
        A rules-based strategy that uses momentum to enhance returns and manage risk by switching between stocks and bonds.
      </p>

      <div className="space-y-6">
        {/* --- Callout Block for Relative Momentum --- */}
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 flex items-start space-x-4">
          <div className="flex-shrink-0">
            <RelativeMomentumIcon />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Relative Momentum</h3>
            <p className="mt-2 text-gray-400">
              This principle involves comparing assets and investing in the one that has performed stronger. The core idea is that winners tend to keep winning.
            </p>
          </div>
        </div>

        {/* --- Callout Block for Absolute Momentum --- */}
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 flex items-start space-x-4">
          <div className="flex-shrink-0">
            <AbsoluteMomentumIcon />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Absolute Momentum</h3>
            <p className="mt-2 text-gray-400">
              Also known as trend-following, this compares an asset's performance to its own past. If the trend is positive, we hold it. If it's negative, we switch to a safer asset like bonds to avoid major downturns.
            </p>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-center">
        GEM's systematic, data-driven approach removes emotional decision-making from investing, typically using a 12-month lookback period to identify robust trends.
      </p>

      <h2 className="text-3xl font-display font-semibold text-white mt-12 mb-6 border-b border-gray-700 pb-3 text-center">
        Academic Backing
      </h2>
      <div className="space-y-6 text-gray-400">
        <p>The strategy is supported by extensive academic research on the momentum factor, a market anomaly where assets that have performed well in the past continue to do so. This effect is attributed to investor behavioral biases like underreaction to news and herding behavior.</p>
        <p>While frequent trading can incur costs, using liquid, low-cost ETFs (like the ones on this site) helps mitigate these expenses, allowing real-world portfolios to capture the momentum premium effectively.</p>
      </div>

      <h2 className="text-3xl font-display font-semibold text-white mt-12 mb-6 border-b border-gray-700 pb-3 text-center">
        Further Reading & Resources
      </h2>
      <ul className="list-disc list-inside space-y-3 text-center">
        <li><a href="https://www.optimalmomentum.com/research-papers" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">Optimal Momentum Research Papers</a></li>
        <li><a href="https://www.youtube.com/watch?v=FcLnhY2CqPU" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">Practical Momentum Investing (YouTube)</a></li>
      </ul>
    </div>
  );
};

export default AboutStrategy;