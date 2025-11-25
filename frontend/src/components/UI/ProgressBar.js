/**
 * Progress Bar Component with Smooth Animations
 * Used in onboarding flow and multi-step processes
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const ProgressBar = ({
  currentStep = 1,
  totalSteps = 3,
  steps = [],
  showLabels = true,
  showIcons = true,
  className = '',
}) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  const progressVariants = {
    initial: { width: 0 },
    animate: {
      width: `${progressPercentage}%`,
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    },
  };

  const stepVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep - 1) return 'current';
    return 'upcoming';
  };

  const getStepIcon = (stepIndex, status) => {
    if (status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-white" />;
    }
    if (status === 'current') {
      return (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-4 h-4 bg-white rounded-full"
        />
      );
    }
    return (
      <div className="w-4 h-4 bg-gray-300 rounded-full" />
    );
  };

  const getStepColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500';
      case 'current':
        return 'bg-blue-500 border-blue-500';
      default:
        return 'bg-gray-300 border-gray-300';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Progress Bar */}
      <div className="relative">
        {/* Background */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          {/* Progress Fill */}
          <motion.div
            variants={progressVariants}
            initial="initial"
            animate="animate"
            className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          />
        </div>

        {/* Progress Percentage */}
        <div className="text-right mt-1">
          <span className="text-xs text-gray-600">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
      </div>

      {/* Step Indicators */}
      {steps.length > 0 && (
        <div className="flex justify-between mt-4">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isCompleted = status === 'completed';
            const isCurrent = status === 'current';

            return (
              <motion.div
                key={index}
                variants={stepVariants}
                initial="initial"
                animate="animate"
                className="flex flex-col items-center space-y-2"
              >
                {/* Step Circle */}
                <div className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStepColor(status)}`}>
                  {showIcons && getStepIcon(index, status)}

                  {/* Current Step Pulse */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-blue-500"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>

                {/* Step Label */}
                {showLabels && (
                  <div className="text-center">
                    <p className={`text-xs font-medium ${
                      isCompleted ? 'text-green-600' :
                      isCurrent ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title || `Step ${index + 1}`}
                    </p>
                    {step.description && (
                      <p className="text-xs text-gray-400 mt-1 max-w-20">
                        {step.description}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Step Numbers (Alternative Layout) */}
      {steps.length === 0 && (
        <div className="flex justify-between mt-4">
          {Array.from({ length: totalSteps }, (_, index) => {
            const status = getStepStatus(index);
            const isCompleted = status === 'completed';
            const isCurrent = status === 'current';

            return (
              <motion.div
                key={index}
                variants={stepVariants}
                initial="initial"
                animate="animate"
                className="flex flex-col items-center space-y-2"
              >
                {/* Step Circle */}
                <div className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStepColor(status)}`}>
                  {showIcons && getStepIcon(index, status)}

                  {/* Step Number */}
                  {!showIcons && (
                    <span className={`text-xs font-bold ${
                      isCompleted || isCurrent ? 'text-white' : 'text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                  )}

                  {/* Current Step Pulse */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-blue-500"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>

                {/* Step Label */}
                {showLabels && (
                  <p className={`text-xs font-medium ${
                    isCompleted ? 'text-green-600' :
                    isCurrent ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    Step {index + 1}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
