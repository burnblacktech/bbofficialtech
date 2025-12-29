/**
 * CAAssistNudge.jsx
 * Opt-in nudge for CA Review.
 *
 * Location: ReviewSection, below Identity Gate.
 * Style: Simple card with CTA.
 * Rules: No block, no redirect (placeholder CTA).
 */

import React from 'react';

const CAAssistNudge = ({ computation }) => {
    const caContext = computation?.caContext;

    // Render Rule: if (!caContext.caAssistRecommended) return null
    if (!caContext || !caContext.caAssistRecommended) return null;

    const handleRequestReview = () => {
        // Placeholder Action
        console.log('Action: CA Review Requested by User');
    };

    return (
        <div className="w-full bg-indigo-50 border border-indigo-100 rounded-xl p-6 mt-6 mb-8 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-semibold text-indigo-900 mb-1">
                        Optional CA review available
                    </h3>
                    <p className="text-sm text-indigo-700/80 max-w-lg">
                        Recommended due to complexity. Filing is still possible without this.
                    </p>
                </div>

                <button
                    onClick={handleRequestReview}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shadow-sm"
                >
                    Request CA Review
                </button>
            </div>
        </div>
    );
};

export default CAAssistNudge;
