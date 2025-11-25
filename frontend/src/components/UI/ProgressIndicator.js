// Progress Indicator Component
import React from 'react';

const ProgressIndicator = ({ steps, currentStep, className = '' }) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={index} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isCompleted ? 'bg-green-600 text-white' : isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              {isCompleted ? '✓' : index + 1}
            </div>
            <span className={`ml-2 text-sm ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'}`}>
              {step}
            </span>
            {index < steps.length - 1 && (
              <div className={`ml-4 w-16 h-0.5 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProgressIndicator;
