// =====================================================
// INVESTMENT PLANNER COMPONENT
// Main component for investment planning tools
// =====================================================

import React, { useState } from 'react';
import { TrendingUp, Calculator, Shield, Heart } from 'lucide-react';
import { useInvestmentRecommendations } from '../hooks/use-investment-planning';
import Section80CPlanner from './section80c-planner';
import NPSCalculator from './nps-calculator';
import HealthInsurancePlanner from './health-insurance-planner';
import TaxSavingSuggestions from './tax-saving-suggestions';

const InvestmentPlanner = ({ userId, currentDeductions = {}, availableAmount = null }) => {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [riskProfile, setRiskProfile] = useState('moderate');

  const { data: recommendationsData, isLoading, isError } = useInvestmentRecommendations({
    availableAmount,
    riskProfile,
    currentDeductions,
  });

  const tabs = [
    { id: 'recommendations', label: 'Recommendations', icon: TrendingUp },
    { id: '80c', label: '80C Planner', icon: Calculator },
    { id: 'nps', label: 'NPS Calculator', icon: Shield },
    { id: 'health', label: 'Health Insurance', icon: Heart },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Investment Planning</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Risk Profile:</label>
          <select
            value={riskProfile}
            onChange={(e) => setRiskProfile(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-gold-500 text-gold-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'recommendations' && (
          <TaxSavingSuggestions
            recommendations={recommendationsData?.recommendations}
            taxSavings={recommendationsData?.taxSavings}
            isLoading={isLoading}
            isError={isError}
            availableAmount={availableAmount}
          />
        )}

        {activeTab === '80c' && (
          <Section80CPlanner
            recommendations={recommendationsData?.recommendations?.filter((r) => r.category === 'equity' || r.category === 'debt')}
            remainingCapacity={recommendationsData?.remainingCapacity?.section80C}
            availableAmount={availableAmount}
          />
        )}

        {activeTab === 'nps' && (
          <NPSCalculator
            npsRecommendation={recommendationsData?.recommendations?.find((r) => r.type === 'NPS - Tier 1')}
          />
        )}

        {activeTab === 'health' && (
          <HealthInsurancePlanner
            recommendations={recommendationsData?.recommendations?.filter((r) => r.category === 'insurance')}
            remainingCapacity={recommendationsData?.remainingCapacity?.section80D}
          />
        )}
      </div>
    </div>
  );
};

export default InvestmentPlanner;

