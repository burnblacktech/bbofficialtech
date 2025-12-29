/**
 * CAConfidencePanel.jsx
 */
import React from 'react';

const CAConfidencePanel = ({ intelligence }) => {
    const { trustScore, confidenceBand, drivers } = intelligence || {};

    let colorClass = 'text-slate-600';
    let bgClass = 'bg-slate-50';

    if (confidenceBand === 'HIGH') {
        colorClass = 'text-green-600';
        bgClass = 'bg-green-50';
    } else if (confidenceBand === 'MEDIUM') {
        colorClass = 'text-amber-600';
        bgClass = 'bg-amber-50';
    } else if (confidenceBand === 'LOW') {
        colorClass = 'text-red-600';
        bgClass = 'bg-red-50';
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Confidence Analysis</h3>

            <div className="flex items-center gap-4 mb-6">
                <div className={`text-4xl font-bold ${colorClass}`}>
                    {trustScore}
                </div>
                <div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${bgClass} ${colorClass}`}>
                        {confidenceBand}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">Trust Score (0-100)</p>
                </div>
            </div>

            {/* Drivers */}
            <div className="space-y-3">
                {drivers?.positive?.length > 0 && (
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-green-700">Positive Drivers</span>
                        <ul className="list-disc leading-tight pl-4 space-y-1">
                            {drivers.positive.map((d, i) => (
                                <li key={i} className="text-xs text-slate-600">{d}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {drivers?.negative?.length > 0 && (
                    <div className="space-y-1 mt-3">
                        <span className="text-xs font-semibold text-red-700">Risk Factors</span>
                        <ul className="list-disc leading-tight pl-4 space-y-1">
                            {drivers.negative.map((d, i) => (
                                <li key={i} className="text-xs text-slate-600">{d}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CAConfidencePanel;
