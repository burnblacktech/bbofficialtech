// =====================================================
// ITR FORM SELECTOR COMPONENT
// Inline ITR form selection with auto-recommendation
// =====================================================

import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, Building2, Calculator, Info, CheckCircle, Loader } from 'lucide-react';
import ITRAutoDetector from '../../services/ITRAutoDetector';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';

const ITRFormSelector = ({ selectedPerson, verificationResult, onITRSelect, initialITR = null, autoDetect = false }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(autoDetect);
  const [recommendation, setRecommendation] = useState(null);
  const [selectedITR, setSelectedITR] = useState(initialITR || 'ITR-1');
  const [error, setError] = useState(null);

  const autoDetector = new ITRAutoDetector();
  const itrDescriptions = autoDetector.getITRDescriptions();

  useEffect(() => {
    if (autoDetect && selectedPerson) {
      analyzeAndRecommend();
    } else if (initialITR) {
      setSelectedITR(initialITR);
      if (onITRSelect) {
        onITRSelect(initialITR);
      }
    }
  }, [autoDetect, selectedPerson]);

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
      };

      // If we have prefill data or user profile, use it
      if (verificationResult) {
        if (verificationResult.category === 'Firm' || verificationResult.category === 'Company') {
          analysisData.isDirector = true;
        }
      }

      // Run auto-detector
      const result = autoDetector.detectITR(analysisData);
      setRecommendation(result);
      const recommendedITR = result.recommendedITR;
      setSelectedITR(recommendedITR);

      // Optionally call backend API for additional analysis
      try {
        const response = await apiClient.post('/itr/recommend-form', {
          pan: selectedPerson?.panNumber,
          verificationResult,
          userData: analysisData,
        });

        if (response.data.success && response.data.data) {
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
        console.warn('Backend recommendation API not available, using frontend analysis');
      }

      if (onITRSelect) {
        onITRSelect(recommendedITR);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze and recommend ITR form');
      setSelectedITR('ITR-1');
      if (onITRSelect) {
        onITRSelect('ITR-1');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleITRSelect = (itrType) => {
    setSelectedITR(itrType);
    if (onITRSelect) {
      onITRSelect(itrType);
    }
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
        return 'bg-success-500';
      case 'ITR-2':
        return 'bg-info-500';
      case 'ITR-3':
        return 'bg-gold-500';
      case 'ITR-4':
        return 'bg-warning-500';
      default:
        return 'bg-gray-500';
    }
  };

  const itrOptions = ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'];

  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-gold-500 mx-auto mb-4" />
            <p className="text-gray-600">Analyzing profile to recommend ITR form...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">ITR Form Selection</h3>
          <p className="text-sm text-gray-600">Select the appropriate ITR form for filing</p>
        </div>
        {recommendation && recommendation.confidence > 0.8 && (
          <div className="flex items-center text-success-600">
            <CheckCircle className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">Auto-Selected</span>
          </div>
        )}
      </div>

      {/* Recommendation Banner */}
      {recommendation && (
        <div className="bg-info-50 rounded-lg p-4 mb-4 border border-info-100">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-info-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-info-900 mb-1">
                Recommended: {recommendation.recommendedITR}
              </h4>
              <p className="text-sm text-info-700 mb-2">{recommendation.reason}</p>
              <div className="flex items-center space-x-4 text-xs text-info-600">
                <span>Confidence: {Math.round(recommendation.confidence * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-error-50 rounded-lg p-4 mb-4 border border-error-100">
          <p className="text-sm text-error-700">{error}</p>
        </div>
      )}

      {/* ITR Form Options */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {itrOptions.map((itrType) => {
          const Icon = getITRIcon(itrType);
          const isSelected = selectedITR === itrType;
          const isRecommended = recommendation?.recommendedITR === itrType;

          return (
            <button
              key={itrType}
              onClick={() => handleITRSelect(itrType)}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${isSelected
                  ? 'border-gold-500 bg-gold-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
                ${isRecommended && !isSelected ? 'ring-2 ring-info-200' : ''}
              `}
            >
              <div className={`w-10 h-10 ${getITRColor(itrType)} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{itrType}</h4>
              <p className="text-xs text-gray-600 mb-2">
                {itrDescriptions[itrType]?.shortDescription || 'Income Tax Return'}
              </p>
              {isSelected && (
                <div className="flex items-center text-gold-600 text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Selected
                </div>
              )}
              {isRecommended && !isSelected && (
                <div className="flex items-center text-info-600 text-xs">
                  <Info className="w-3 h-3 mr-1" />
                  Recommended
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ITRFormSelector;

