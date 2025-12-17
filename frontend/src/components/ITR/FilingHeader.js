// =====================================================
// ITR FILING HEADER COMPONENT
// Header component for ITR filing forms
// =====================================================

import React from 'react';
import {
  FileText,
  Calendar,
  User,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  HelpCircle,
} from 'lucide-react';

const FilingHeader = ({
  itrType,
  step,
  title,
  subtitle,
  showProgress = true,
  onBack,
  showHelp = true,
  onHelp,
  filingStatus = 'in_progress',
}) => {
  const getStatusIcon = () => {
    switch (filingStatus) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-error-600" />;
      case 'in_progress':
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusText = () => {
    switch (filingStatus) {
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Needs Attention';
      case 'in_progress':
      default:
        return 'In Progress';
    }
  };

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">Back</span>
                </button>
              )}

              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-heading-2 font-bold text-slate-900">
                    ITR-{itrType || '1'} Filing
                  </h1>
                  {subtitle && (
                    <p className="text-slate-600 mt-1">{subtitle}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-body-regular">
                {getStatusIcon()}
                <span className={`font-medium ${
                  filingStatus === 'completed' ? 'text-green-600' :
                  filingStatus === 'error' ? 'text-error-600' : 'text-blue-600'
                }`}>
                  {getStatusText()}
                </span>
              </div>

              {showHelp && onHelp && (
                <button
                  onClick={onHelp}
                  className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span className="font-medium">Help</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {showProgress && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-body-regular font-medium">
                      1
                    </div>
                    <span className="text-body-regular font-medium text-slate-700">Personal Info</span>
                  </div>

                  <div className="flex-1 h-px bg-gray-300 mx-2"></div>

                  <div className={`flex items-center space-x-2 ${
                    step >= 2 ? 'text-blue-600' : 'text-slate-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200'
                    }`}>
                      2
                    </div>
                    <span className="text-body-regular font-medium">Income Details</span>
                  </div>

                  <div className="flex-1 h-px bg-gray-300 mx-2"></div>

                  <div className={`flex items-center space-x-2 ${
                    step >= 3 ? 'text-blue-600' : 'text-slate-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200'
                    }`}>
                      3
                    </div>
                    <span className="text-body-regular font-medium">Deductions</span>
                  </div>

                  <div className="flex-1 h-px bg-gray-300 mx-2"></div>

                  <div className={`flex items-center space-x-2 ${
                    step >= 4 ? 'text-blue-600' : 'text-slate-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= 4 ? 'bg-blue-600 text-white' : 'bg-slate-200'
                    }`}>
                      4
                    </div>
                    <span className="text-body-regular font-medium">Tax Summary</span>
                  </div>

                  <div className="flex-1 h-px bg-gray-300 mx-2"></div>

                  <div className={`flex items-center space-x-2 ${
                    step >= 5 ? 'text-blue-600' : 'text-slate-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= 5 ? 'bg-blue-600 text-white' : 'bg-slate-200'
                    }`}>
                      5
                    </div>
                    <span className="text-body-regular font-medium">Review & File</span>
                  </div>
                </div>

                <div className="text-body-regular text-slate-600">
                  Step {step} of 5
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-6 text-body-regular text-slate-600">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Assessment Year: 2024-25</span>
              </div>

              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Secure & Encrypted</span>
              </div>
            </div>

            {title && (
              <div className="text-body-large font-semibold text-slate-900">
                {title}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilingHeader;
