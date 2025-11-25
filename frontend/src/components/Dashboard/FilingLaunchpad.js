// =====================================================
// FILING LAUNCHPAD - EMPTY STATE DASHBOARD CARD
// Large, visually engaging card for first-time filers
// =====================================================

import React from 'react';
import { FileText, Zap, Shield, ArrowRight, Sparkles } from 'lucide-react';

const FilingLaunchpad = ({ onStartFiling }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header Section */}
      <div className="relative p-8 pb-6">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 right-4 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-purple-500 rounded-full blur-2xl"></div>
        </div>

        {/* Content */}
        <div className="relative">
          {/* Icon */}
          <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 mx-auto shadow-lg">
            <FileText className="w-10 h-10 text-white" />
          </div>

          {/* Headline */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 text-center mb-3 sm:mb-4 px-2">
            Ready to file your taxes for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Assessment Year 2024-25
            </span>
            ?
          </h1>

          {/* Subtext */}
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 text-center mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4">
            Our AI-powered process makes it simple, fast, and secure.
            Let's maximize your refund.
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <Zap className="w-6 h-6 text-yellow-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">AI-Powered</span>
            </div>
            <div className="flex items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <Shield className="w-6 h-6 text-green-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">Bank-Grade Security</span>
            </div>
            <div className="flex items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <Sparkles className="w-6 h-6 text-purple-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">Maximize Refunds</span>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="text-center">
            <button
              onClick={onStartFiling}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FileText className="w-6 h-6 mr-3" />
              Start My ITR Filing
              <ArrowRight className="w-5 h-5 ml-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Accent */}
      <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
    </div>
  );
};

export default FilingLaunchpad;
