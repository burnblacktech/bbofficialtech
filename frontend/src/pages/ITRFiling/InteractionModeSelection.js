import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import enterpriseDebugger from '../../services/EnterpriseDebugger';
import EnterpriseErrorBoundary from '../../components/EnterpriseErrorBoundary';
import {
  FileText, Calculator, Upload, CheckCircle, ArrowRight,
  Info, Clock, Shield,
} from 'lucide-react';
import {
  EnterpriseCard,
  EnterpriseButton,
  EnterpriseBadge,
} from '../../components/DesignSystem/EnterpriseComponents';
import { getEnterpriseClasses } from '../../components/DesignSystem/EnterpriseDesignSystem';

// Interaction Mode Selection Screen
// Purpose: Let users choose how they want to start their ITR filing journey
// Position: After PAN verification, before ITR selection

const InteractionModeSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState(null);

  // Get context from navigation state
  const {
    pan,
    verificationResult,
    prefillData,
    isCAFiling,
  } = location.state || {};

  // Load user's last used preference
  useEffect(() => {
    const savedPreference = localStorage.getItem('interactionModePreference');
    if (savedPreference) {
      setSelectedMode(savedPreference);
      enterpriseDebugger.log('INFO', 'InteractionModeSelection', 'Loaded user preference', {
        preference: savedPreference,
        user: user?.email,
      });
    }
  }, [user?.email]);

  // Interaction modes configuration
  const interactionModes = [
    {
      id: 'source-first',
      title: 'Source-First',
      subtitle: 'Tell us your income sources',
      description: 'Start by telling us about your salary, business, investments, and other income sources. We\'ll guide you through each category.',
      icon: Calculator,
      color: 'blue',
      recommended: user?.role === 'user' || user?.role === 'huf',
      features: [
        'Step-by-step income breakdown',
        'Real-time tax calculation',
        'Smart suggestions',
        'Mobile-friendly forms',
      ],
      estimatedTime: '15-20 minutes',
      bestFor: 'Most users, especially first-time filers',
    },
    {
      id: 'doc-first',
      title: 'Doc-First',
      subtitle: 'Upload your documents',
      description: 'Upload your Form 16, bank statements, investment proofs, and other documents. We\'ll extract the information automatically.',
      icon: Upload,
      color: 'green',
      recommended: user?.role === 'ca' || user?.role === 'ca_firm_admin',
      features: [
        'Smart document parsing',
        'Automatic data extraction',
        'Document verification',
        'CA review workflow',
      ],
      estimatedTime: '10-15 minutes',
      bestFor: 'CA professionals, users with organized documents',
    },
    {
      id: 'prefill-first',
      title: 'Prefill-First',
      subtitle: 'Import from government data',
      description: 'Connect your AIS (Annual Information Statement) and 26AS to automatically import your income and tax data.',
      icon: FileText,
      color: 'purple',
      recommended: false,
      features: [
        'AIS data import',
        '26AS integration',
        'Bank interest auto-fill',
        'TDS verification',
      ],
      estimatedTime: '5-10 minutes',
      bestFor: 'Salaried employees, users with simple tax situations',
    },
  ];

  const handleModeSelection = (modeId) => {
    setSelectedMode(modeId);

    // Save user preference
    localStorage.setItem('interactionModePreference', modeId);

    enterpriseDebugger.log('INFO', 'InteractionModeSelection', 'User selected interaction mode', {
      mode: modeId,
      user: user?.email,
      role: user?.role,
    });

    // Navigate to Financial Profile first, then ITR selection
    navigate('/financial-profile', {
      state: {
        pan,
        verificationResult,
        prefillData,
        isCAFiling,
        interactionMode: modeId,
        fromModeSelection: true,
      },
    });
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        button: 'bg-blue-600 hover:bg-blue-700',
        icon: 'text-blue-600',
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        button: 'bg-green-600 hover:bg-green-700',
        icon: 'text-green-600',
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        button: 'bg-purple-600 hover:bg-purple-700',
        icon: 'text-purple-600',
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <EnterpriseErrorBoundary>
      <div className="min-h-screen bg-neutral-50 py-6">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-4">
              How would you like to start?
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Choose the way that feels most comfortable for you. You can always switch between methods as you go.
            </p>
          </div>

          {/* User Preference Banner - ENTERPRISE STANDARD */}
          {selectedMode && (
            <EnterpriseCard className="mb-6 p-4 bg-primary-50 border-primary-200">
              <div className="flex items-center space-x-3">
                <Info className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-primary-800 font-medium">
                    Last time you used <span className="font-semibold">
                      {interactionModes.find(m => m.id === selectedMode)?.title}
                    </span>
                  </p>
                  <p className="text-primary-600 text-sm">
                    We've highlighted it below, but feel free to choose a different method.
                  </p>
                </div>
              </div>
            </EnterpriseCard>
          )}

          {/* Interaction Modes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {interactionModes.map((mode) => {
              const colors = getColorClasses(mode.color);
              const IconComponent = mode.icon;
              const isRecommended = mode.recommended;
              const isUserPreference = mode.id === selectedMode;

              return (
                <div
                  key={mode.id}
                  className={`relative ${colors.bg} ${colors.border} border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    isUserPreference ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                  } ${isRecommended ? 'ring-2 ring-green-500 ring-opacity-50' : ''}`}
                  onClick={() => handleModeSelection(mode.id)}
                >
                  {/* Recommendation Badge */}
                  {isRecommended && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Recommended
                    </div>
                  )}

                  {/* User Preference Badge */}
                  {isUserPreference && !isRecommended && (
                    <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Your Choice
                    </div>
                  )}

                  {/* Icon */}
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4">
                    <IconComponent className={`w-8 h-8 ${colors.icon}`} />
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <h3 className={`text-xl font-bold ${colors.text} mb-2`}>
                      {mode.title}
                    </h3>
                    <p className={`text-sm font-medium ${colors.text} mb-3`}>
                      {mode.subtitle}
                    </p>
                    <p className="text-gray-600 text-sm mb-4">
                      {mode.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-2 mb-4">
                      {mode.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Time Estimate */}
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
                      <Clock className="w-4 h-4" />
                      <span>{mode.estimatedTime}</span>
                    </div>

                    {/* Best For */}
                    <p className="text-xs text-gray-500 mb-4">
                      Best for: {mode.bestFor}
                    </p>

                    {/* CTA Button */}
                    <button
                      className={`w-full ${colors.button} text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2`}
                    >
                      <span>Choose {mode.title}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Help Section */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Shield className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Need Help Choosing?
                </h3>
                <div className="space-y-2 text-gray-600">
                  <p>
                    <strong>Source-First:</strong> Perfect if you're comfortable filling forms and want to understand each step.
                  </p>
                  <p>
                    <strong>Doc-First:</strong> Great if you have all your documents ready and want to upload them quickly.
                  </p>
                  <p>
                    <strong>Prefill-First:</strong> Ideal if you're salaried and want to import data from government sources.
                  </p>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Don't worry!</strong> You can always switch between methods or combine them as you go through the filing process.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/pan-verification')}
              className="text-gray-500 hover:text-gray-700 font-medium flex items-center space-x-2 mx-auto"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Back to PAN Verification</span>
            </button>
          </div>
        </div>
      </div>
    </EnterpriseErrorBoundary>
  );
};

export default InteractionModeSelection;
