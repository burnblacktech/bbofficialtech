// =====================================================
// ITR FORM RECOMMENDER COMPONENT
// CA logic to determine suitable ITR form
// =====================================================

import React, { useState, useEffect } from 'react';
import { enterpriseLogger } from '../../utils/logger';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  FileText,
  TrendingUp,
  Building2,
  Calculator,
  ArrowRight,
  Loader,
  Info,
  Shield,
} from 'lucide-react';
import ITRAutoDetector from '../../services/ITRAutoDetector';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';
import { ensureJourneyStart, trackEvent } from '../../utils/analyticsEvents';

const ITRFormRecommender = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [recommendation, setRecommendation] = useState(null);
  const [selectedITR, setSelectedITR] = useState(null);
  const [userData, setUserData] = useState({});
  const [error, setError] = useState(null);

  const selectedPerson = location.state?.selectedPerson;
  const verificationResult = location.state?.verificationResult;
  const skipPANVerification = location.state?.skipPANVerification;

  const autoDetector = new ITRAutoDetector();
  const itrDescriptions = autoDetector.getITRDescriptions();

  useEffect(() => {
    ensureJourneyStart();
    trackEvent('itr_determination_view', { surface: 'recommend-form', panVerified: !!verificationResult?.isValid });
    analyzeAndRecommend();
  }, []);

  const analyzeAndRecommend = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);

      // Prepare user data for analysis
      const analysisData = {
        salary: 0,
        interestIncome: 0,
        businessIncome: 0,
        professionalIncome: 0,
        capitalGains: 0,
        houseProperties: [],
        foreignIncome: 0,
        agriculturalIncome: 0,
        isNRI: false,
        isDirector: false,
        isPartner: false,
        dtaaClaim: false,
        ...userData,
      };

      // If we have prefill data or user profile, use it
      // For now, we'll use basic analysis based on PAN verification result
      if (verificationResult) {
        // PAN category might indicate business/professional income
        if (verificationResult.category === 'Firm' || verificationResult.category === 'Company') {
          analysisData.isDirector = true;
        }
      }

      // Run auto-detector
      const result = autoDetector.detectITR(analysisData);
      setRecommendation(result);
      setSelectedITR(result.recommendedITR);

      // Optionally call backend API for additional analysis
      try {
        const response = await apiClient.post('/itr/recommend-form', {
          pan: selectedPerson?.panNumber,
          verificationResult,
          userData: analysisData,
        });

        if (response.data.success && response.data.data) {
          // Merge backend recommendation if available
          const backendRecommendation = response.data.data;
          if (backendRecommendation.recommendedITR) {
            setRecommendation(prev => ({
              ...prev,
              ...backendRecommendation,
            }));
            setSelectedITR(backendRecommendation.recommendedITR);
          }
        }
      } catch (apiError) {
        // Backend API is optional, continue with frontend recommendation
        enterpriseLogger.warn('Backend recommendation API not available, using frontend analysis');
      }

    } catch (err) {
      enterpriseLogger.error('Analysis error', { error: err });
      setError('Failed to analyze and recommend ITR form');
      // Default to ITR-1
      setRecommendation({
        recommendedITR: 'ITR-1',
        confidence: 0.5,
        reason: 'Default recommendation due to analysis error',
        triggeredRules: [],
        allEligibleITRs: ['ITR-1'],
      });
      setSelectedITR('ITR-1');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleITRSelect = (itrType) => {
    setSelectedITR(itrType);
  };

  const handleProceed = () => {
    if (!selectedITR) {
      toast.error('Please select an ITR form');
      return;
    }

    trackEvent('itr_type_selected', {
      surface: 'recommend-form',
      itrType: selectedITR,
      confidence: recommendation?.confidence || null,
      caReviewRequired: recommendation?.triggeredRules?.some(r => r.caReviewRequired) || false,
    });

    navigate('/itr/computation', {
      state: {
        selectedPerson,
        verificationResult,
        selectedITR,
        recommendation,
        fromRecommendForm: true, // Flag to help with back navigation
      },
    });
  };

  const getITRIcon = (itrType) => {
    switch (itrType) {
      case 'ITR-1':
        return FileText;
      case 'ITR-2':
        return TrendingUp;
      case 'ITR-3':
        return Building2;
      case 'ITR-4':
        return Calculator;
      default:
        return FileText;
    }
  };

  const getITRColor = (itrType) => {
    switch (itrType) {
      case 'ITR-1':
        return 'bg-green-500';
      case 'ITR-2':
        return 'bg-blue-500';
      case 'ITR-3':
        return 'bg-purple-500';
      case 'ITR-4':
        return 'bg-gold-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Analyzing your profile to recommend the best ITR form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-elevation-1 border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/itr/select-person')}
                className="p-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-transform"
              >
                <ArrowLeft className="h-5 w-5 text-slate-700" />
              </button>
              <div>
                <h1 className="text-heading-4 font-semibold text-slate-900">ITR Form Selection</h1>
                <p className="text-body-small text-slate-500">Step 3: Choose the right ITR form</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Selected Person Info */}
        {selectedPerson && (
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{selectedPerson.name}</h3>
                <p className="text-body-regular text-slate-500">PAN: {selectedPerson.panNumber}</p>
              </div>
              {verificationResult?.isValid && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-1" />
                  <span className="text-body-regular">PAN Verified</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommendation */}
        {recommendation && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Recommended: {recommendation.recommendedITR}</h3>
                <p className="text-body-regular text-blue-700 mb-2">{recommendation.reason}</p>
                <div className="flex items-center space-x-4 text-body-small text-blue-600">
                  <span>Confidence: {Math.round(recommendation.confidence * 100)}%</span>
                  {recommendation.triggeredRules?.[0]?.caReviewRequired && (
                    <span className="flex items-center">
                      <Shield className="w-3 h-3 mr-1" />
                      CA Review Recommended
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-error-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-error-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">Analysis Error</h4>
                <p className="text-body-regular text-error-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* ITR Options */}
        <div className="space-y-4">
          <h2 className="text-heading-3 font-semibold text-slate-900">Select ITR Form</h2>

          {['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'].map((itrType) => {
            const Icon = getITRIcon(itrType);
            const description = itrDescriptions[itrType];
            const isSelected = selectedITR === itrType;
            const isRecommended = recommendation?.recommendedITR === itrType;
            const isEligible = recommendation?.allEligibleITRs?.includes(itrType) ?? true;

            return (
              <div
                key={itrType}
                onClick={() => isEligible && handleITRSelect(itrType)}
                className={`
                  bg-white rounded-xl border-2 p-4 cursor-pointer transition-all
                  ${isSelected ? 'border-blue-500 shadow-elevation-2' : 'border-slate-200 hover:border-slate-300'}
                  ${!isEligible ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 ${getITRColor(itrType)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-900">{description.name}</h3>
                      {isRecommended && (
                        <span className="text-body-small bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          Recommended
                        </span>
                      )}
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-body-regular text-slate-600 mb-2">{description.description}</p>

                    <div className="flex items-center space-x-4 text-body-small text-slate-500">
                      <span>⏱ {description.estimatedTime}</span>
                      {description.caRequired && (
                        <span className="flex items-center">
                          <Shield className="w-3 h-3 mr-1" />
                          CA Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Proceed Button */}
        {selectedITR && (
          <div className="flex justify-end pt-4">
            <button
              onClick={handleProceed}
              className="flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              <span>Continue with {selectedITR}</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ITRFormRecommender;

