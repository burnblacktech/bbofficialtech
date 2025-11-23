// =====================================================
// PROGRESS STEPPER COMPONENT
// Ultra-refined progress stepper with behavioral psychology
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export const ProgressStepper = ({
  steps,
  currentStep,
  onStepClick,
  showPercentage = true,
  animated = true,
  className = '',
  ...props
}) => {
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={`w-full ${className}`} {...props}>
      {/* Progress Header */}
      {showPercentage && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-neutral-800">Progress</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-sm text-neutral-500">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>
      )}

      {/* Overall Progress Bar */}
      <div className="w-full bg-neutral-200 rounded-full h-2 mb-8">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full shadow-sm"
        />
      </div>

      {/* Step Indicators */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => onStepClick && onStepClick(index)}
              >
                {/* Step Circle */}
                <motion.div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-300 border-2
                    ${isCompleted ? 'bg-success-500 text-white border-success-500 shadow-glow-success' :
                      isCurrent ? 'bg-primary-500 text-white border-primary-500 shadow-glow ring-4 ring-primary-200' :
                      'bg-neutral-100 text-neutral-400 border-neutral-200 hover:border-neutral-300'}
                    ${animated ? 'group-hover:scale-110' : ''}
                  `}
                  whileHover={animated ? { scale: 1.1 } : {}}
                  whileTap={animated ? { scale: 0.95 } : {}}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="font-bold">{index + 1}</span>
                  )}
                </motion.div>

                {/* Step Label */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className={`
                    mt-3 text-sm font-medium text-center max-w-24 leading-tight
                    ${isCompleted ? 'text-success-700' :
                      isCurrent ? 'text-primary-700 font-semibold' :
                      'text-neutral-500'}
                  `}
                >
                  {step.label}
                </motion.div>

                {/* Step Description */}
                {step.description && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className={`
                      mt-1 text-xs text-center max-w-28 leading-tight
                      ${isCompleted ? 'text-success-600' :
                        isCurrent ? 'text-primary-600' :
                        'text-neutral-400'}
                    `}
                  >
                    {step.description}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Connecting Lines */}
        <div className="absolute top-6 left-0 right-0 h-0.5 -z-10">
          {steps.slice(0, -1).map((_, index) => {
            const isCompleted = index < currentStep;
            return (
              <motion.div
                key={index}
                initial={{ width: 0 }}
                animate={{ width: isCompleted ? '100%' : '0%' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`
                  h-0.5 absolute top-0
                  ${isCompleted ? 'bg-success-500' : 'bg-neutral-200'}
                `}
                style={{
                  left: `${(index / (steps.length - 1)) * 100}%`,
                  width: `${100 / (steps.length - 1)}%`
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressStepper;