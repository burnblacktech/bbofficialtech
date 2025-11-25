import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import enterpriseDebugger from '../../services/EnterpriseDebugger';
import EnterpriseErrorBoundary from '../../components/EnterpriseErrorBoundary';
import {
  CheckCircle, ArrowRight, Info, Clock, Shield,
  Calculator, FileText, Building2, TrendingUp,
  AlertTriangle, Users, Briefcase,
} from 'lucide-react';
import {
  EnterpriseCard,
  EnterpriseButton,
  EnterpriseBadge,
  EnterpriseStatCard,
} from '../../components/DesignSystem/EnterpriseComponents';

// ITR Selection Screen - Next step after PAN verification
// Purpose: Show recommended ITR type based on prefill data and allow user override

const ITRSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Get interaction mode and verification data from navigation state
  const { interactionMode, fromModeSelection, verificationResult, selectedMember } = location.state || {};
  const [selectedITR, setSelectedITR] = useState(null);

  // Log interaction mode context
  useEffect(() => {
    if (interactionMode) {
      enterpriseDebugger.log('INFO', 'ITRSelection', 'Received interaction mode context', {
        interactionMode,
        fromModeSelection,
        user: user?.email,
      });
    }

    if (verificationResult) {
      enterpriseDebugger.log('INFO', 'ITRSelection', 'Received PAN verification data', {
        pan: verificationResult.pan,
        isValid: verificationResult.isValid,
        selectedMember: selectedMember?.name || 'Self',
      });
    }
  }, [interactionMode, fromModeSelection, verificationResult, selectedMember, user?.email]);
  const [recommendedITR, setRecommendedITR] = useState(null);
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  // ITR Types with descriptions and requirements
  const itrTypes = {
    'ITR-1': {
      name: 'ITR-1 (Sahaj)',
      description: 'For salaried individuals with simple tax structure',
      icon: Briefcase,
      requirements: [
        'Salary income only',
        'One house property',
        'Bank interest (up to ₹10,000)',
        'No capital gains',
        'No business income',
      ],
      estimatedTime: '15-20 minutes',
      caRequired: false,
      complexity: 'Simple',
      color: 'green',
    },
    'ITR-2': {
      name: 'ITR-2',
      description: 'For individuals with complex income sources',
      icon: TrendingUp,
      requirements: [
        'Capital gains',
        'Multiple house properties',
        'Foreign income',
        'Director/partner income',
        'Agricultural income',
      ],
      estimatedTime: '30-45 minutes',
      caRequired: 'Recommended',
      complexity: 'Moderate',
      color: 'blue',
    },
    'ITR-3': {
      name: 'ITR-3',
      description: 'For business and professional income',
      icon: Building2,
      requirements: [
        'Business income',
        'Professional income',
        'P&L statement required',
        'Balance sheet required',
        'Audit reports (if applicable)',
      ],
      estimatedTime: '45-60 minutes',
      caRequired: 'Required',
      complexity: 'Complex',
      color: 'purple',
    },
    'ITR-4': {
      name: 'ITR-4 (Sugam)',
      description: 'For presumptive business income',
      icon: Calculator,
      requirements: [
        'Presumptive taxation',
        'Turnover up to ₹2 crores',
        'Simplified calculation',
        'No detailed P&L required',
      ],
      estimatedTime: '25-35 minutes',
      caRequired: 'Optional',
      complexity: 'Moderate',
      color: 'orange',
    },
  };

  // Auto-detect ITR type based on PAN data
  useEffect(() => {
    const analyzePANData = async () => {
      try {
        setIsAnalyzing(true);

        // Get PAN data from localStorage or API
        const panData = JSON.parse(localStorage.getItem('panVerificationData') || '{}');

        // Simple auto-detection logic (can be enhanced with more sophisticated rules)
        let recommended = 'ITR-1'; // Default to simplest

        // Check for business indicators
        if (panData.category === 'company' || panData.category === 'partnership') {
          recommended = 'ITR-3';
        }
        // Check for complex individual cases
        else if (panData.category === 'person' && panData.aadhaarLinked === false) {
          recommended = 'ITR-2';
        }

        setRecommendedITR(recommended);
        setSelectedITR(recommended);
        setIsAnalyzing(false);

        enterpriseDebugger.log('INFO', 'ITRSelection', 'ITR analysis completed', {
          panData,
          recommendedITR: recommended,
          userRole: user?.role,
        });

      } catch (error) {
        console.error('Error analyzing PAN data:', error);
        setRecommendedITR('ITR-1');
        setSelectedITR('ITR-1');
        setIsAnalyzing(false);
      }
    };

    analyzePANData();
  }, [user?.role]);

  // Handle ITR selection
  const handleITRSelection = (itrType) => {
    setSelectedITR(itrType);
    enterpriseDebugger.log('INFO', 'ITRSelection', 'ITR type selected', {
      selectedITR: itrType,
      recommendedITR,
      userRole: user?.role,
    });
  };

  // Proceed to income details
  const handleProceed = () => {
    if (!selectedITR) return;

    // Store ITR selection
    localStorage.setItem('selectedITR', selectedITR);

    enterpriseDebugger.log('SUCCESS', 'ITRSelection', 'Proceeding to ITR filing', {
      selectedITR,
      userRole: user?.role,
    });

    // Navigate to appropriate ITR filing page
    let navigationPath = '/itr/filing'; // Default to ITR-1

    if (selectedITR === 'ITR-2') {
      navigationPath = '/itr2/filing';
    } else if (selectedITR === 'ITR-3') {
      navigationPath = '/itr3/filing';
    } else if (selectedITR === 'ITR-4') {
      navigationPath = '/itr4/filing'; // Future implementation
    }

    navigate(navigationPath, {
      state: {
        selectedITR,
        interactionMode,
        fromModeSelection,
        selectedMember,
        verificationResult,
      },
    });
  };

  // Get color classes for ITR cards
  const getColorClasses = (color) => {
    const colors = {
      green: 'border-green-200 bg-green-50 text-green-800',
      blue: 'border-blue-200 bg-blue-50 text-blue-800',
      purple: 'border-purple-200 bg-purple-50 text-purple-800',
      orange: 'border-orange-200 bg-orange-50 text-orange-800',
    };
    return colors[color] || colors.green;
  };

  return (
    <EnterpriseErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Select ITR Type</h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Based on your PAN verification, we've analyzed your profile and recommend the most suitable ITR form for your filing.
            </p>
          </div>

          {/* Analysis Status */}
          {isAnalyzing ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing your profile...</p>
            </div>
          ) : (
            <>
              {/* Recommended ITR */}
              {recommendedITR && (
                <div className="mb-8">
                  <div className="bg-white rounded-xl border-2 border-blue-200 p-6 shadow-sm">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                          Recommended: {itrTypes[recommendedITR].name}
                        </h2>
                        <p className="text-gray-600 mb-4">
                          {itrTypes[recommendedITR].description}
                        </p>

                        <div className="flex items-center space-x-6 mb-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {itrTypes[recommendedITR].estimatedTime}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              CA Required: {itrTypes[recommendedITR].caRequired}
                            </span>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleITRSelection(recommendedITR)}
                            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                              selectedITR === recommendedITR
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            Use Recommended
                          </button>
                          <button
                            onClick={() => setShowAllOptions(!showAllOptions)}
                            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {showAllOptions ? 'Hide' : 'View All Options'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* All ITR Options */}
              {showAllOptions && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">All ITR Types</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(itrTypes).map(([key, itr]) => {
                      const IconComponent = itr.icon;
                      const isSelected = selectedITR === key;
                      const isRecommended = key === recommendedITR;

                      return (
                        <div
                          key={key}
                          onClick={() => handleITRSelection(key)}
                          className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-lg ${
                              isSelected ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <IconComponent className={`w-6 h-6 ${
                                isSelected ? 'text-blue-600' : 'text-gray-600'
                              }`} />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-semibold text-gray-900">{itr.name}</h4>
                                {isRecommended && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    Recommended
                                  </span>
                                )}
                              </div>

                              <p className="text-sm text-gray-600 mb-3">{itr.description}</p>

                              <div className="space-y-2 mb-4">
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">{itr.estimatedTime}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Shield className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">CA: {itr.caRequired}</span>
                                </div>
                              </div>

                              <div className="text-xs text-gray-500">
                                <p className="font-medium mb-1">Requirements:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {itr.requirements.slice(0, 3).map((req, index) => (
                                    <li key={index}>{req}</li>
                                  ))}
                                  {itr.requirements.length > 3 && (
                                    <li>+{itr.requirements.length - 3} more</li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Proceed Button */}
              {selectedITR && (
                <div className="text-center">
                  <button
                    onClick={handleProceed}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl mx-auto"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Continue with {itrTypes[selectedITR].name}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <p className="text-sm text-gray-500 mt-3">
                    Estimated time: {itrTypes[selectedITR].estimatedTime}
                  </p>
                </div>
              )}

              {/* Help Section */}
              <div className="mt-12 bg-blue-50 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Need Help Choosing?</h4>
                    <p className="text-blue-800 text-sm mb-3">
                      Not sure which ITR form is right for you? Our system will automatically detect if you need to switch to a different form as you add your income details.
                    </p>
                    <div className="text-sm text-blue-700">
                      <p>• You can always change your ITR type later</p>
                      <p>• We'll guide you through any additional requirements</p>
                      <p>• CA assistance is available if needed</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </EnterpriseErrorBoundary>
  );
};

export default ITRSelection;
