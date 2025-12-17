// =====================================================
// FILING LAUNCHPAD - EMPTY STATE DASHBOARD CARD
// Large, visually engaging card with Solar Gold / Ember palette
// =====================================================

import React from 'react';
import { FileText, Zap, Shield, ArrowRight, Sparkles } from 'lucide-react';

const FilingLaunchpad = ({ onStartFiling }) => {
  return (
    <div className="bg-gradient-to-br from-primary-50 via-white to-ember-50 rounded-2xl shadow-card border border-primary-100 overflow-hidden">
      {/* Compact Content */}
      <div className="relative p-5">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-24 h-24 bg-primary-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-4 left-4 w-20 h-20 bg-ember-500 rounded-full blur-2xl"></div>
        </div>

        {/* Content */}
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 bg-aurora-gradient rounded-2xl shadow-elevation-3 shadow-primary-500/20 flex-shrink-0">
              <FileText className="w-7 h-7 text-white" />
            </div>

            {/* Headline */}
            <div className="flex-1 min-w-0">
              <h2 className="text-heading-4 sm:text-heading-3 font-bold text-slate-900 mb-1">
                Ready to file your taxes for{' '}
                <span className="text-transparent bg-clip-text bg-aurora-gradient">
                  AY 2025-26
                </span>
                ?
              </h2>
              <p className="text-body-regular text-slate-600">
                AI-powered, secure, and fast. Maximize your refund.
              </p>
            </div>
          </div>

          {/* Features - Compact Row */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="flex items-center px-3 py-1.5 bg-white rounded-xl shadow-elevation-1 border border-primary-100">
              <Zap className="w-3.5 h-3.5 text-primary-500 mr-2" />
              <span className="text-body-small font-medium text-slate-700">AI-Powered</span>
            </div>
            <div className="flex items-center px-3 py-1.5 bg-white rounded-xl shadow-elevation-1 border border-success-100">
              <Shield className="w-3.5 h-3.5 text-success-500 mr-2" />
              <span className="text-body-small font-medium text-slate-700">Bank-Grade Security</span>
            </div>
            <div className="flex items-center px-3 py-1.5 bg-white rounded-xl shadow-elevation-1 border border-ember-100">
              <Sparkles className="w-3.5 h-3.5 text-ember-500 mr-2" />
              <span className="text-body-small font-medium text-slate-700">Maximize Refunds</span>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            onClick={onStartFiling}
            className="w-full flex items-center justify-center px-5 py-3 bg-aurora-gradient text-white text-body-regular font-semibold rounded-xl hover:opacity-90 transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-elevation-3 shadow-primary-500/30"
          >
            <FileText className="w-4 h-4 mr-2" />
            Start My ITR Filing
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>

      {/* Bottom Accent - Aurora gradient */}
      <div className="h-1.5 bg-aurora-gradient"></div>
    </div>
  );
};

export default FilingLaunchpad;
