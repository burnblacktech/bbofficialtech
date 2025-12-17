// =====================================================
// AI SUGGESTIONS COMPONENT
// Display AI-powered tax optimization recommendations
// =====================================================

import React, { useState } from 'react';
import { Lightbulb, TrendingUp, ArrowRight, CheckCircle, AlertCircle, Info, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';

const AISuggestions = ({ opportunities, onSimulate, summary, onDismiss }) => {
  const [expandedCards, setExpandedCards] = useState({});
  const [dismissedIndices, setDismissedIndices] = useState(new Set());
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-error-50 border-error-200 text-error-900';
      case 'medium':
        return 'bg-warning-50 border-warning-200 text-warning-900';
      case 'low':
        return 'bg-info-50 border-info-200 text-info-900';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-900';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return AlertCircle;
      case 'medium':
      case 'low':
      default:
        return Lightbulb;
    }
  };

  const handleSimulateOpportunity = (opportunity) => {
    const scenario = {
      type: opportunity.type,
      name: opportunity.title,
      changes: opportunity.changes || {
        amount: opportunity.investmentAmount || opportunity.potentialSavings / 0.3, // Rough estimate
      },
    };

    if (opportunity.type === 'hraOptimization') {
      scenario.changes = {
        rentPaid: opportunity.changes?.rentPaid,
        hra: opportunity.changes?.hra,
        cityType: opportunity.changes?.cityType,
      };
    } else if (opportunity.type === 'regimeSwitch') {
      scenario.changes = {
        taxRegime: 'new',
      };
    }

    onSimulate(scenario);
  };

  const toggleExpand = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleDismiss = (index) => {
    setDismissedIndices(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
    if (onDismiss) {
      onDismiss(opportunities[index]);
    }
  };

  // Filter out dismissed opportunities
  const visibleOpportunities = opportunities.filter((_, index) => !dismissedIndices.has(index));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Sparkles className="h-5 w-5 text-gold-600 mr-2" />
          <h3 className="text-heading-md text-slate-900">AI-Powered Recommendations</h3>
        </div>
        <div className="flex items-center gap-3">
          {summary && (
            <div className="flex items-center gap-2 text-body-sm">
              <span className="text-slate-600">Potential Savings:</span>
              <span className="font-semibold text-success-600">
                ₹{summary.estimatedTotalSavings?.toLocaleString('en-IN') || 0}
              </span>
            </div>
          )}
          <span className="px-3 py-1 text-body-xs font-medium bg-gold-100 text-gold-800 rounded-full">
            {visibleOpportunities.length} opportunities
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {opportunities.map((opportunity, index) => {
          // Skip dismissed opportunities
          if (dismissedIndices.has(index)) {
            return null;
          }
          const PriorityIcon = getPriorityIcon(opportunity.priority);
          const isExpanded = expandedCards[index];
          const hasExplanation = opportunity.explanation;

          return (
            <div
              key={`${opportunity.type}-${index}`}
              className={`border-2 rounded-xl p-5 transition-all ${getPriorityColor(opportunity.priority)} ${
                isExpanded ? 'shadow-elevation-3' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start flex-1">
                  <PriorityIcon className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${
                    opportunity.priority === 'high' ? 'text-error-600' : 'text-warning-600'
                  }`} />
                  <div className="flex-1">
                    <h4 className="text-heading-sm font-semibold mb-1">{opportunity.title}</h4>
                    <p className="text-body-sm opacity-90">{opportunity.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <span className={`px-2 py-1 text-body-xs font-medium rounded ${
                    opportunity.priority === 'high'
                      ? 'bg-error-200 text-error-800'
                      : opportunity.priority === 'medium'
                      ? 'bg-warning-200 text-warning-800'
                      : 'bg-info-200 text-info-800'
                  }`}>
                    {opportunity.priority}
                  </span>
                  {/* Dismiss button - UI.md: Dismissible */}
                  <button
                    onClick={() => handleDismiss(index)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-100"
                    aria-label="Dismiss suggestion"
                    title="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {opportunity.potentialSavings > 0 && (
                <div className="mb-4 p-3 bg-white bg-opacity-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm font-medium">Potential Savings</span>
                    <span className="text-heading-md font-bold text-success-600">
                      ₹{opportunity.potentialSavings.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {opportunity.investmentAmount && opportunity.investmentAmount > 0 && (
                    <div className="flex items-center justify-between mt-2 text-body-xs opacity-75">
                      <span>Investment Required</span>
                      <span className="font-medium">₹{opportunity.investmentAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {opportunity.impactScore && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between text-body-xs">
                        <span className="opacity-75">Impact Score</span>
                        <span className="font-medium">{Math.round(opportunity.impactScore)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {hasExplanation && (
                <div className="mb-4">
                  <button
                    onClick={() => toggleExpand(index)}
                    className="flex items-center w-full text-left text-body-sm text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    <span className="flex-1">Learn more about this recommendation</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="mt-2 p-3 bg-white bg-opacity-70 rounded-xl text-body-sm text-slate-700">
                      {opportunity.explanation}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => handleSimulateOpportunity(opportunity)}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-xl hover:border-gold-500 hover:bg-gold-50 transition-colors flex items-center justify-center text-body-regular font-medium"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Simulate This
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          );
        })}
      </div>

      {visibleOpportunities.length === 0 && (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
          <CheckCircle className="h-12 w-12 text-success-400 mx-auto mb-4" />
          <h4 className="text-heading-sm text-slate-900 mb-2">No Optimization Opportunities</h4>
          <p className="text-body-sm text-slate-600">
            Your tax planning appears optimal. You can still create custom scenarios.
          </p>
        </div>
      )}
    </div>
  );
};

export default AISuggestions;

