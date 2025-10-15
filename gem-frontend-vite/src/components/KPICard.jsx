import React from 'react';

const KPICard = ({ title, value, change, changeColor, icon, isLoading }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center space-x-4">
      <div className="bg-gray-700 p-3 rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-400">{title}</p>
        {isLoading ? (
          <div className="h-8 w-32 bg-gray-700 rounded-md animate-pulse mt-1"></div>
        ) : (
          <>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {change && (
              <p className={`text-sm font-semibold ${changeColor}`}>{change}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default KPICard;