// =====================================================
// PROGRESS COMPONENT - ENHANCED
// Linear, circular, and step progress indicators
// =====================================================

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const Progress = ({
  value = 0,
  max = 100,
  variant = 'linear', // 'linear' | 'circular' | 'step'
  label,
  showPercentage = false,
  indeterminate = false,
  steps = [],
  currentStep = 0,
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Linear Progress
  if (variant === 'linear') {
    return (
      <div className={cn('w-full', className)} {...props}>
        {(label || showPercentage) && (
          <div className="flex justify-between items-center mb-2">
            {label && (
              <span className="text-body-sm text-gray-600" style={{ fontSize: '13px', lineHeight: '20px' }}>
                {label}
              </span>
            )}
            {showPercentage && (
              <span className="text-body-sm font-medium text-gray-800" style={{ fontSize: '13px', fontWeight: 500, lineHeight: '20px' }}>
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}
        <div className="w-full bg-gray-200 rounded" style={{ height: '8px', borderRadius: '4px' }}>
          {indeterminate ? (
            <div
              className="h-full rounded bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 bg-[length:200%_100%] animate-shimmer"
              style={{
                width: '40%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          ) : (
            <div
              className="h-full rounded transition-all duration-300 ease-out bg-gradient-to-r from-gold-500 to-gold-600"
              style={{
                width: `${percentage}%`,
                borderRadius: '4px',
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // Step Progress
  if (variant === 'step' && steps.length > 0) {
    return (
      <div className={cn('w-full', className)} {...props}>
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isUpcoming = index > currentStep;

            return (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all',
                      {
                        'bg-gold-500 border-gold-500': isCompleted,
                        'bg-white border-gold-500': isCurrent,
                        'bg-white border-gray-300': isUpcoming,
                      },
                    )}
                  >
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : isCurrent ? (
                      <div className="w-3 h-3 bg-gold-500 rounded-full" />
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      'mt-2 text-body-sm text-center',
                      {
                        'text-gray-800 font-medium': isCompleted || isCurrent,
                        'text-gray-500': isUpcoming,
                      },
                    )}
                    style={{ fontSize: '13px', lineHeight: '20px' }}
                  >
                    style={{ fontSize: '13px', lineHeight: '20px' }}
                  >
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2',
                      index < currentStep ? 'bg-gold-500' : 'bg-gray-300',
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // Circular Progress
  const sizes = {
    sm: { size: 16, stroke: 2 },
    md: { size: 40, stroke: 3 },
    lg: { size: 64, stroke: 4 },
  };

  const { size: circleSize, stroke } = sizes[size];
  const radius = (circleSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('inline-flex items-center justify-center', className)} {...props}>
      <svg width={circleSize} height={circleSize} className="transform -rotate-90">
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          stroke="#D4AF37"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={indeterminate ? 0 : offset}
          strokeLinecap="round"
          className={indeterminate ? 'animate-spin' : 'transition-all duration-300'}
        />
      </svg>
      {showPercentage && !indeterminate && (
        <span className="absolute text-body-sm font-medium text-gray-800" style={{ fontSize: '13px', fontWeight: 500 }}>
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

export default Progress;
