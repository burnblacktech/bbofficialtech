// =====================================================
// TAX SAVINGS RECOMMENDATIONS COMPONENT
// AI-powered tax optimization suggestions
// Critical competitive feature with ClearTax/ComputeTax
// =====================================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { taxSavingsService } from '../../../services';
import { Card, Button, Alert, Select, Progress } from '../../DesignSystem';

const TaxSavingsRecommendations = ({ userProfile, currentInvestments, onRecommendationSelect, className = '' }) => {
  const [recommendations, setRecommendations] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRiskProfile, setSelectedRiskProfile] = useState(userProfile?.riskProfile || 'moderate');

  const riskProfiles = [
    { value: 'conservative', label: 'Conservative (Low Risk)', description: 'Safe investments with steady returns' },
    { value: 'moderate', label: 'Moderate (Balanced Risk)', description: 'Balanced approach with good returns' },
    { value: 'aggressive', label: 'Aggressive (High Risk)', description: 'High returns with higher risk' },
  ];

  useEffect(() => {
    if (userProfile) {
      generateRecommendations();
    }
  }, [userProfile, selectedRiskProfile]);

  /**
   * Generate tax saving recommendations
   */
  const generateRecommendations = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const userProfileWithRisk = {
        ...userProfile,
        riskProfile: selectedRiskProfile,
      };

      const result = await taxSavingsService.generateRecommendations(
        userProfileWithRisk,
        currentInvestments || {},
      );

      if (result.success) {
        setRecommendations(result);
      }
    } catch (err) {
      console.error('Tax recommendations error:', err);
      setError(err.message || 'Failed to generate recommendations');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Handle recommendation selection
   */
  const handleRecommendationSelect = (recommendation) => {
    if (onRecommendationSelect) {
      onRecommendationSelect(recommendation);
    }
  };

  /**
   * Format currency amount
   */
  const formatCurrency = (amount) => {
    return `₹${Math.abs(amount).toLocaleString('en-IN')}`;
  };

  /**
   * Get risk level color
   */
  const getRiskColor = (risk) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-red-600 bg-red-100',
    };
    return colors[risk] || 'text-gray-600 bg-gray-100';
  };

  /**
   * Get urgency color
   */
  const getUrgencyColor = (urgency) => {
    const colors = {
      high: 'text-red-600 bg-red-100',
      medium: 'text-yellow-600 bg-yellow-100',
      low: 'text-green-600 bg-green-100',
    };
    return colors[urgency] || 'text-gray-600 bg-gray-100';
  };

  if (isGenerating) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Generating Personalized Recommendations
            </h3>
            <p className="text-gray-600">
              Our AI is analyzing your profile and finding the best tax-saving options...
            </p>
          </div>
          <Progress value={75} className="h-2 max-w-md mx-auto" />
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-6 ${className}`}
    >
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            💡 AI-Powered Tax Saving Recommendations
          </h3>
          <p className="text-gray-600">
            Get personalized suggestions to maximize your tax savings based on your profile and risk appetite
          </p>
        </div>

        {/* Risk Profile Selector */}
        <div className="max-w-md mx-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Risk Profile
          </label>
          <Select
            value={selectedRiskProfile}
            onChange={(e) => setSelectedRiskProfile(e.target.value)}
            options={riskProfiles}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            {riskProfiles.find(rp => rp.value === selectedRiskProfile)?.description}
          </p>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <div>
          <Alert
            type="error"
            message={error}
            dismissible={true}
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {/* Recommendations Results */}
      {recommendations && (
        <>
          {/* Summary */}
          <Card className="p-6 bg-green-50 border-green-200">
            <h4 className="text-lg font-semibold text-green-900 mb-4">📊 Tax Saving Summary</h4>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">
                  {recommendations.summary?.totalRecommendations || 0}
                </div>
                <div className="text-sm text-green-700">Recommendations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(recommendations.summary?.totalInvestmentSuggested || 0)}
                </div>
                <div className="text-sm text-green-700">Total Investment</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(recommendations.taxSavings?.total || 0)}
                </div>
                <div className="text-sm text-green-700">Tax Savings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">
                  {recommendations.deadline?.daysLeft || 0}
                </div>
                <div className="text-sm text-green-700">Days Left</div>
              </div>
            </div>

            {/* Deadline Alert */}
            {recommendations.deadline?.urgent && (
              <div className="mt-4">
                <Alert
                  type="warning"
                  message={recommendations.deadline.message}
                  dismissible={false}
                />
              </div>
            )}
          </Card>

          {/* Recommendations List */}
          <div className="space-y-4">
            {recommendations.recommendations.map((recommendation, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {recommendation.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {recommendation.description}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRiskColor(recommendation.riskLevel)}`}>
                          {recommendation.riskLevel?.toUpperCase()} RISK
                        </span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getUrgencyColor(recommendation.urgency)}`}>
                          {recommendation.urgency?.toUpperCase()} PRIORITY
                        </span>
                      </div>
                    </div>

                    {/* Key Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Section:</span>
                          <span className="font-medium text-gray-900">{recommendation.section}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Suggested Amount:</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(recommendation.suggestedAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Lock-in Period:</span>
                          <span className="font-medium text-gray-900">
                            {recommendation.lockInPeriod ? `${recommendation.lockInPeriod} years` : 'None'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Expected Returns:</span>
                          <span className="font-medium text-gray-900">
                            {recommendation.expectedReturn?.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax Savings:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(recommendation.expectedSavings?.taxSaved || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Suitability:</span>
                          <span className="font-medium text-gray-900">
                            {recommendation.suitability?.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pros and Cons */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {recommendation.pros && (
                        <div>
                          <h5 className="font-medium text-green-900 text-sm mb-2">✅ Pros:</h5>
                          <ul className="text-sm text-green-700 space-y-1">
                            {recommendation.pros.slice(0, 3).map((pro, i) => (
                              <li key={i} className="flex items-start">
                                <span className="mr-1">•</span>
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {recommendation.cons && (
                        <div>
                          <h5 className="font-medium text-red-900 text-sm mb-2">⚠️ Considerations:</h5>
                          <ul className="text-sm text-red-700 space-y-1">
                            {recommendation.cons.slice(0, 3).map((con, i) => (
                              <li key={i} className="flex items-start">
                                <span className="mr-1">•</span>
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Implementation Steps */}
                    {recommendation.implementation && (
                      <div>
                        <h5 className="font-medium text-blue-900 text-sm mb-2">🔧 How to Implement:</h5>
                        <ol className="text-sm text-blue-700 space-y-1">
                          {recommendation.implementation.slice(0, 4).map((step, i) => (
                            <li key={i} className="flex items-start">
                              <span className="mr-2 font-medium">{i + 1}.</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="lg:w-48">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleRecommendationSelect(recommendation)}
                      className="w-full lg:w-full mb-3"
                    >
                      Invest Now
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Show more details
                        console.log('Show details for:', recommendation.name);
                      }}
                      className="w-full lg:w-full"
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Tax Breakdown */}
          {recommendations.taxSavings && (
            <Card className="p-6 bg-purple-50 border-purple-200">
              <h4 className="text-lg font-semibold text-purple-900 mb-4">
                💰 Tax Savings Breakdown by Section
              </h4>
              <div className="space-y-3">
                {Object.entries(recommendations.taxSavings).map(([section, amount]) => (
                  section !== 'total' && amount > 0 && (
                    <div key={section} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-purple-200 rounded-full"></div>
                        <span className="font-medium text-purple-900">
                          Section {section}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-purple-900">
                          {formatCurrency(amount)}
                        </div>
                        <div className="text-sm text-purple-700">
                          {((amount / recommendations.taxSavings.total) * 100).toFixed(1)}% of total
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>

              {/* Total */}
              <div className="mt-4 pt-4 border-t border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-purple-600 rounded-full"></div>
                    <span className="font-bold text-purple-900 text-lg">
                      Total Tax Savings
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-purple-900 text-lg">
                      {formatCurrency(recommendations.taxSavings.total)}
                    </div>
                    <div className="text-sm text-purple-700">
                      {(recommendations.summary?.totalInvestmentSuggested > 0 &&
                        ((recommendations.taxSavings.total / recommendations.summary.totalInvestmentSuggested) * 100).toFixed(1))}%
                      effective tax saving rate
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">
              📅 Next Steps
            </h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <div>
                  <p className="text-sm text-blue-800 font-medium">Choose Your Investments</p>
                  <p className="text-sm text-blue-700">Select from the recommendations above based on your risk profile and financial goals</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <div>
                  <p className="text-sm text-blue-800 font-medium">Complete KYC and Documentation</p>
                  <p className="text-sm text-blue-700">Ensure all required documents are ready for the investment process</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <div>
                  <p className="text-sm text-blue-800 font-medium">Invest Before Deadline</p>
                  <p className="text-sm text-blue-700">Complete investments before March 31st to claim deductions for this year</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">4</span>
                <div>
                  <p className="text-sm text-blue-800 font-medium">Save All Documents</p>
                  <p className="text-sm text-blue-700">Keep investment proofs and receipts for ITR filing and future reference</p>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </motion.div>
  );
};

export default TaxSavingsRecommendations;
