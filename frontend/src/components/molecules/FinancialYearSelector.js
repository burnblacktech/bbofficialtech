import React from 'react';
import { Calendar } from 'lucide-react';

const FINANCIAL_YEARS = [
    { value: '2024-25', label: 'FY 2024-25 (Current)', isCurrent: true },
    { value: '2023-24', label: 'FY 2023-24', isCurrent: false },
    { value: '2022-23', label: 'FY 2022-23', isCurrent: false },
];

const FinancialYearSelector = ({ selectedFY, onFYChange, showCopyOption = false, onCopyFromPrevious }) => {
    return (
        <div
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-6 bg-white rounded-xl border border-gray-200 shadow-sm mb-6 transition-all duration-200 hover:shadow-md"
            style={{ animation: 'fadeSlideIn 0.3s ease-out' }}
        >
            {/* FY Selector */}
            <div className="flex items-center gap-3 flex-1">
                <Calendar size={20} className="text-gray-600 flex-shrink-0" />
                <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Financial Year:</label>
                <select
                    value={selectedFY}
                    onChange={(e) => onFYChange(e.target.value)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium transition-all duration-150 hover:border-gray-400 min-h-[44px]"
                >
                    {FINANCIAL_YEARS.map((fy) => (
                        <option key={fy.value} value={fy.value}>
                            {fy.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Copy from Previous Year Option */}
            {showCopyOption && selectedFY === '2024-25' && (
                <div
                    className="flex items-center gap-3 w-full sm:w-auto"
                    style={{ animation: 'fadeSlideIn 0.3s ease-out 0.1s both' }}
                >
                    <span className="text-sm text-gray-600 whitespace-nowrap">Copy from:</span>
                    <select
                        className="flex-1 sm:flex-initial px-4 py-2.5 border border-gray-300 rounded-lg text-sm transition-all duration-150 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                        onChange={(e) => {
                            if (e.target.value) {
                                onCopyFromPrevious(e.target.value);
                                e.target.value = ''; // Reset
                            }
                        }}
                        defaultValue=""
                    >
                        <option value="">Select FY...</option>
                        <option value="2023-24">FY 2023-24</option>
                        <option value="2022-23">FY 2022-23</option>
                    </select>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default FinancialYearSelector;
export { FINANCIAL_YEARS };
