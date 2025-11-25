// =====================================================
// CA BOT PAGE - CONVERSATIONAL ITR FILING INTERFACE
// Main page component for CA Bot interaction
// =====================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCABot } from '../../contexts/CABotContext';
import CABot from '../../components/CABot/CABot.tsx';
import {
  ArrowLeft,
  Settings,
  RotateCcw,
  FileText,
  Calculator,
  Users,
  Globe,
  Volume2,
  Bot,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CABotPage = () => {
  const navigate = useNavigate();
  const {
    isActive,
    isLoading,
    userType,
    language,
    isVoiceEnabled,
    currentStep,
    createSession,
    destroySession,
    resetConversation,
  } = useCABot();

  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    userType: 'educated',
    language: 'en',
    voiceEnabled: false,
  });

  // Initialize bot session on mount
  useEffect(() => {
    if (!isActive && !isLoading) {
      initializeBotSession();
    }
  }, [isActive, isLoading, initializeBotSession]);

  // Initialize bot session
  const initializeBotSession = useCallback(async () => {
    try {
      await createSession({
        userType: settings.userType,
        language: settings.language,
        voiceEnabled: settings.voiceEnabled,
      });

      toast.success('CA Bot session started successfully!');
    } catch (error) {
      toast.error('Failed to start CA Bot session');
    }
  }, [createSession, settings]);

  // Handle back navigation
  const handleBack = () => {
    if (isActive) {
      destroySession();
    }
    navigate('/dashboard');
  };

  // Handle settings change
  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
    setShowSettings(false);

    // Restart session with new settings
    if (isActive) {
      destroySession();
      setTimeout(() => {
        createSession(newSettings);
      }, 100);
    }
  };

  // Handle conversation reset
  const handleReset = async () => {
    try {
      await resetConversation();
      toast.success('Conversation reset successfully!');
    } catch (error) {
      toast.error('Failed to reset conversation');
    }
  };

  // Get step progress
  const getStepProgress = () => {
    const steps = [
      'greeting',
      'personal_info',
      'family_selection',
      'income_details',
      'deductions',
      'tax_computation',
      'review',
      'submission',
    ];

    const currentIndex = steps.indexOf(currentStep);
    return {
      current: currentIndex + 1,
      total: steps.length,
      percentage: ((currentIndex + 1) / steps.length) * 100,
    };
  };

  // Get user type display
  const getUserTypeDisplay = () => {
    const types = {
      non_educated: { label: 'Simple', color: 'bg-green-100 text-green-800' },
      educated: { label: 'Balanced', color: 'bg-blue-100 text-blue-800' },
      ultra_educated: { label: 'Advanced', color: 'bg-purple-100 text-purple-800' },
    };

    return types[userType] || types.educated;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Initializing CA Bot
          </h2>
          <p className="text-gray-600">
            Setting up your conversational ITR filing experience...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    CA Bot - Conversational ITR Filing
                  </h1>
                  <p className="text-sm text-gray-500">
                    {language === 'hi' ? 'आपका ITR फाइलिंग सहायक' : 'Your AI-powered ITR filing assistant'}
                  </p>
                </div>
              </div>
            </div>

            {/* Center - Progress */}
            <div className="flex-1 max-w-md mx-8">
              {isActive && (
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-sm text-gray-600">
                      Step {getStepProgress().current} of {getStepProgress().total}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getUserTypeDisplay().color}`}>
                      {getUserTypeDisplay().label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${getStepProgress().percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2">
              {/* Language indicator */}
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Globe className="w-4 h-4" />
                <span className="uppercase">{language}</span>
              </div>

              {/* Voice indicator */}
              {isVoiceEnabled && (
                <div className="flex items-center space-x-1 text-sm text-green-600">
                  <Volume2 className="w-4 h-4" />
                  <span>Voice</span>
                </div>
              )}

              {/* Reset button */}
              {isActive && (
                <button
                  onClick={handleReset}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Reset Conversation"
                >
                  <RotateCcw className="w-5 h-5 text-gray-600" />
                </button>
              )}

              {/* Settings button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        {isActive ? (
          <CABot />
        ) : (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Welcome section */}
            <div className="text-center mb-12">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot className="w-12 h-12 text-white" />
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to CA Bot
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Experience the future of ITR filing with our conversational AI assistant.
                Get personalized guidance, real-time tax computation, and expert-level accuracy.
              </p>

              <button
                onClick={initializeBotSession}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Start Conversation
              </button>
            </div>

            {/* Features grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Adaptive Experience
                </h3>
                <p className="text-gray-600">
                  Automatically adapts to your knowledge level - from simple explanations to advanced tax planning.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Hindi Support
                </h3>
                <p className="text-gray-600">
                  Full Hindi language support with natural conversation flow and technical term explanations.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Volume2 className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Voice Interface
                </h3>
                <p className="text-gray-600">
                  Speak naturally and get voice responses. Perfect for hands-free filing experience.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Calculator className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Real-time Computation
                </h3>
                <p className="text-gray-600">
                  Get instant tax calculations and optimization suggestions as you provide information.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Smart Guidance
                </h3>
                <p className="text-gray-600">
                  AI-powered suggestions for deductions, exemptions, and tax optimization strategies.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  CA-like Experience
                </h3>
                <p className="text-gray-600">
                  Mimics real CA consultation with professional guidance and personalized attention.
                </p>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                How It Works
              </h2>

              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Start Conversation
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Begin with a simple greeting and let the AI guide you through the process.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Provide Information
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Answer questions naturally - the AI adapts to your communication style.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Get Real-time Updates
                  </h3>
                  <p className="text-gray-600 text-sm">
                    See tax calculations and suggestions update as you provide information.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">4</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Submit & Track
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Submit your ITR and track the status with real-time updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              CA Bot Settings
            </h2>

            <div className="space-y-4">
              {/* User Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Type
                </label>
                <select
                  value={settings.userType}
                  onChange={(e) => setSettings({ ...settings, userType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="non_educated">Simple - Easy explanations</option>
                  <option value="educated">Balanced - Professional language</option>
                  <option value="ultra_educated">Advanced - Technical details</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>

              {/* Voice */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.voiceEnabled}
                    onChange={(e) => setSettings({ ...settings, voiceEnabled: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable Voice Interface
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSettingsChange(settings)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CABotPage;
