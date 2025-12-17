// =====================================================
// ITR FILING STEPPER - MASTER NAVIGATION COMPONENT
// Persistent, highly visible stepper with progress indicators
// =====================================================

import React from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

const ITRFilingStepper = ({
  currentStep,
  steps,
  onStepClick,
  progress = 0,
}) => {
  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepIcon = (stepIndex, status) => {
    if (status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (status === 'current') {
      return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>;
    }
    return <Circle className="w-5 h-5 text-slate-400" />;
  };

  const getStepClasses = (status) => {
    const baseClasses = 'flex items-center px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer';

    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-50 border border-green-200 hover:bg-green-100`;
      case 'current':
        return `${baseClasses} bg-blue-50 border border-blue-200 shadow-elevation-1`;
      default:
        return `${baseClasses} hover:bg-slate-50`;
    }
  };

  const getTextClasses = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-900 font-medium';
      case 'current':
        return 'text-blue-900 font-semibold';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-6 mb-8">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-body-regular font-medium text-slate-700">Progress</span>
          <span className="text-body-regular text-slate-600">{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const icon = getStepIcon(index, status);
          const isClickable = index <= currentStep || status === 'completed';

          return (
            <div
              key={step.id}
              className={getStepClasses(status)}
              onClick={() => isClickable && onStepClick && onStepClick(index)}
            >
              {/* Icon */}
              <div className="mr-4">
                {icon}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className={getTextClasses(status)}>
                  {step.title}
                </div>
                {step.description && (
                  <div className="text-body-small text-slate-500 mt-1">
                    {step.description}
                  </div>
                )}
              </div>

              {/* Arrow */}
              {index < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-400" />
              )}
            </div>
          );
        })}
      </div>

      {/* Current Step Info */}
      {steps[currentStep] && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              {steps[currentStep].icon && React.createElement(steps[currentStep].icon, { className: 'w-4 h-4 text-blue-600' })}
            </div>
            <div>
              <p className="font-medium text-slate-900">
                Current Step: {steps[currentStep].title}
              </p>
              <p className="text-body-regular text-slate-600">
                {steps[currentStep].description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ITRFilingStepper;
