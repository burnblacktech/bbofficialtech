// =====================================================
// DEDUCTIONS MANAGER - Comprehensive Chapter VI-A Deductions
// BurnBlack premium design for managing all deduction sections
// =====================================================

import React, { useState } from 'react';
import {
  Section80C,
  Section80CCC,
  Section80CCD,
  Section80D,
  Section80DD,
  Section80DDB,
  Section80E,
  Section80EE,
  Section80G,
  Section80GG,
  Section80GGA,
  Section80GGC,
  Section80TTA,
  Section80U,
} from '../index';
import DeductionUtilizationDashboard from './DeductionUtilizationDashboard';
import AIDeductionSuggestions from './AIDeductionSuggestions';

const DeductionsManager = ({ filingId, formData, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const deductionTabs = [
    { id: 'overview', label: 'Overview', description: 'Utilization Dashboard', isOverview: true },
    { id: '80C', label: '80C', component: Section80C, description: 'Investments & Savings' },
    { id: '80CCC', label: '80CCC', component: Section80CCC, description: 'Pension Funds' },
    { id: '80CCD', label: '80CCD', component: Section80CCD, description: 'NPS Contributions' },
    { id: '80D', label: '80D', component: Section80D, description: 'Health Insurance' },
    { id: '80DD', label: '80DD', component: Section80DD, description: 'Disabled Dependent' },
    { id: '80DDB', label: '80DDB', component: Section80DDB, description: 'Medical Treatment' },
    { id: '80E', label: '80E', component: Section80E, description: 'Education Loan' },
    { id: '80EE', label: '80EE/80EEA', component: Section80EE, description: 'Home Loan Interest' },
    { id: '80G', label: '80G', component: Section80G, description: 'Donations' },
    { id: '80GG', label: '80GG', component: Section80GG, description: 'Rent Paid' },
    { id: '80GGA', label: '80GGA', component: Section80GGA, description: 'Scientific Research' },
    { id: '80GGC', label: '80GGC', component: Section80GGC, description: 'Political Donations' },
    { id: '80TTA', label: '80TTA/80TTB', component: Section80TTA, description: 'Savings Interest' },
    { id: '80U', label: '80U', component: Section80U, description: 'Self Disability' },
  ];

  // Standard: section components call onUpdate({ section80C: 12345, section80EEA: 50000, ... })
  const handleDeductionPatch = (patch) => {
    if (!onUpdate || !patch || typeof patch !== 'object') return;
    onUpdate({
      deductions: {
        ...(formData?.deductions || {}),
        ...patch,
      },
    });
  };

  // Calculate total deductions
  const totalDeductions = Object.values(formData?.deductions || {}).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0,
  );

  // Render Overview Dashboard
  const renderOverview = () => {
    return (
      <DeductionUtilizationDashboard
        filingId={filingId}
        formData={formData}
        userAge={formData?.userAge || 30}
        totalIncome={formData?.totalIncome || 0}
      />
    );
  };

  const handleApplySuggestion = (suggestion) => {
    // Navigate to the suggested section
    setActiveTab(suggestion.section);
    // Could also pre-fill form data here
  };

  const handleDismissSuggestion = (suggestionId) => {
    // Store dismissed suggestions in localStorage or state
    // For now, just a placeholder
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6">
        <h2 className="text-heading-xl text-slate-900 mb-2">Chapter VI-A Deductions</h2>
        <p className="text-body-sm text-slate-600">
          Manage all tax-saving deductions under Chapter VI-A of the Income Tax Act
        </p>
      </div>

      {/* AI Suggestions */}
      {activeTab !== 'overview' && (
        <AIDeductionSuggestions
          filingId={filingId}
          formData={formData}
          onApplySuggestion={handleApplySuggestion}
          onDismiss={handleDismissSuggestion}
        />
      )}

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200">
        <div className="w-full">
          <div className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-100 p-1 text-slate-500 w-full overflow-x-auto">
            <div className="flex gap-2 w-full min-w-max">
              {deductionTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 ${
                    activeTab === tab.id
                      ? 'bg-gold-500 text-white shadow-elevation-1'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Contents */}
          <div className="mt-4 p-4">
            {activeTab === 'overview' ? (
              renderOverview()
            ) : (
              deductionTabs
                .filter((tab) => tab.id === activeTab && !tab.isOverview)
                .map((tab) => {
                  const Component = tab.component;
                  return (
                    <div key={tab.id}>
                      <Component
                        filingId={filingId}
                        onUpdate={handleDeductionPatch}
                        userAge={formData?.userAge || 30}
                        totalIncome={formData?.totalIncome || 0}
                      />
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-gold-50 to-gold-50 rounded-xl shadow-elevation-1 border border-gold-200 p-6">
        <h3 className="text-heading-md text-slate-900 mb-4">Total Deductions Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {deductionTabs
            .filter((tab) => !tab.isOverview)
            .map((tab) => {
              let amount = 0;
              if (tab.id === '80EE') {
                amount = (parseFloat(formData?.deductions?.section80EE) || 0) + (parseFloat(formData?.deductions?.section80EEA) || 0);
              } else if (tab.id === '80TTA') {
                amount = (parseFloat(formData?.deductions?.section80TTA) || 0) + (parseFloat(formData?.deductions?.section80TTB) || 0);
              } else {
                amount = parseFloat(formData?.deductions?.[`section${tab.id}`]) || 0;
              }
              return (
                <div key={tab.id} className="bg-white rounded-xl p-3">
                  <div className="text-body-xs text-slate-600 mb-1">{tab.label}</div>
                  <div className="text-heading-sm font-bold text-gold-600">
                    ₹{amount.toLocaleString('en-IN')}
                  </div>
                </div>
              );
            })}
        </div>
        <div className="mt-4 pt-4 border-t border-gold-200">
          <div className="flex justify-between items-center">
            <span className="text-heading-md font-semibold text-slate-900">Total Deductions</span>
            <span className="text-heading-xl font-bold text-gold-600">
              ₹{totalDeductions.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeductionsManager;

