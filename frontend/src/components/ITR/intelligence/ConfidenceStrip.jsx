/**
 * ConfidenceStrip.jsx
 * Displays the Trust Score (0-100) and Confidence Band.
 * 
 * Location: Below Financial Timeline.
 * Style: Large number, color-coded band, one-line explanation.
 * Rules: No icons, no CTA, pure read-only.
 */

import React from 'react';

const ConfidenceStrip = ({ computation }) => {
    // Graceful fallback
    const confidence = computation?.confidence || {};
    const { trustScore = 0, confidenceBand = 'LOW' } = confidence;

    // Determine styles and copy based on band
    const getBandConfig = (band) => {
        switch (band) {
            case 'HIGH':
                return {
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-100',
                    copy: 'Based on verified data, this looks reliable.'
                };
            case 'MEDIUM':
                return {
                    color: 'text-amber-600',
                    bgColor: 'bg-amber-50',
                    borderColor: 'border-amber-100',
                    copy: 'Some assumptions detected. Still acceptable.'
                };
            default: // LOW
                return {
                    color: 'text-slate-600',
                    bgColor: 'bg-slate-50',
                    borderColor: 'border-slate-100',
                    copy: 'Multiple assumptions. Review recommended.'
                };
        }
    };

    const config = getBandConfig(confidenceBand);

    // Only render if we have a valid trustScore calculation (basic check)
    // Assuming backend always returns min 30.
    if (!computation || !computation.confidence) return null;

    return (
        <div className={`w-full py-4 px-6 border-y ${config.bgColor} ${config.borderColor} flex items-center justify-between mb-6`}>
            <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">
                    Filing Confidence
                </span>
                <span className={`text-sm font-medium ${config.color}`}>
                    {config.copy}
                </span>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                    <span className={`text-3xl font-bold ${config.color} leading-none`}>
                        {trustScore}
                    </span>
                    <span className={`text-[10px] font-bold uppercase ${config.color} tracking-wide`}>
                        {confidenceBand}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ConfidenceStrip;
