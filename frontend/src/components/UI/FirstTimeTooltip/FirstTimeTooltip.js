// =====================================================
// FIRST TIME TOOLTIP COMPONENT (Spotlight Tour)
// First-time user guidance with spotlight effect
// Per UI.md specifications (lines 8203-8227)
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import { cn } from '../../../utils';

/**
 * FirstTimeTooltip Component
 * Spotlight tour for first-time users
 */
export const FirstTimeTooltip = ({
  steps = [],
  featureKey,
  onComplete,
  onSkip,
  className = '',
  ...props
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Check if tour should be shown
  useEffect(() => {
    if (!featureKey) return;

    const hasSeenTour = localStorage.getItem(`firstTimeTour_${featureKey}`);
    if (!hasSeenTour) {
      setIsVisible(true);
    }
  }, [featureKey]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (featureKey) {
      localStorage.setItem(`firstTimeTour_${featureKey}`, 'true');
    }
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    if (featureKey) {
      localStorage.setItem(`firstTimeTour_${featureKey}`, 'true');
    }
    setIsVisible(false);
    if (onSkip) onSkip();
  };

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];
  if (!step) return null;

  const targetElement = step.target
    ? typeof step.target === 'string'
      ? document.querySelector(step.target)
      : step.target
    : null;

  // Calculate spotlight position
  const getSpotlightStyle = () => {
    if (!targetElement) return {};

    const rect = targetElement.getBoundingClientRect();
    return {
      position: 'fixed',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: 9998,
    };
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop with spotlight */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[9997]"
            onClick={handleSkip}
          >
            {/* Spotlight cutout */}
            {targetElement && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="absolute border-2 border-gold-500 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
                style={getSpotlightStyle()}
              />
            )}
          </motion.div>

          {/* Tooltip */}
          {targetElement && (
            <Tooltip
              content={
                <div className="space-y-3" style={{ maxWidth: '320px' }}>
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3
                        className="text-heading-sm font-semibold text-white mb-1"
                        style={{ fontSize: '16px', fontWeight: 600 }}
                      >
                        {step.title}
                      </h3>
                      {step.subtitle && (
                        <p
                          className="text-body-sm text-slate-300"
                          style={{ fontSize: '13px' }}
                        >
                          {step.subtitle}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleSkip}
                      className="p-1 rounded hover:bg-gray-800 transition-colors"
                      aria-label="Skip tour"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  {/* Content */}
                  {step.content && (
                    <p
                      className="text-body-sm text-gray-200"
                      style={{ fontSize: '13px', lineHeight: '20px' }}
                    >
                      {step.content}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                    {/* Progress */}
                    <div className="flex items-center gap-2">
                      <span
                        className="text-body-xs text-slate-400"
                        style={{ fontSize: '12px' }}
                      >
                        {currentStep + 1} of {steps.length}
                      </span>
                      <div className="flex gap-1">
                        {steps.map((_, index) => (
                          <div
                            key={index}
                            className={cn('h-1 w-1 rounded-full', {
                              'bg-gold-500': index === currentStep,
                              'bg-gray-600': index !== currentStep,
                            })}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-2">
                      {currentStep > 0 && (
                        <button
                          onClick={handlePrevious}
                          className="p-1 rounded hover:bg-gray-800 transition-colors"
                          aria-label="Previous step"
                        >
                          <ChevronLeft className="w-4 h-4 text-slate-400" />
                        </button>
                      )}
                      <button
                        onClick={handleNext}
                        className="px-3 py-1.5 bg-gold-500 text-white rounded-xl text-body-sm font-semibold hover:bg-gold-600 transition-colors"
                        style={{ fontSize: '13px', fontWeight: 600 }}
                      >
                        {currentStep < steps.length - 1 ? 'Next' : 'Got it'}
                      </button>
                    </div>
                  </div>
                </div>
              }
              side={step.placement || 'top'}
              variant="dark"
              delayDuration={0}
            >
              <div
                style={{
                  position: 'fixed',
                  ...getSpotlightStyle(),
                  pointerEvents: 'none',
                }}
              />
            </Tooltip>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * useFirstTimeTour Hook
 * Hook to manage first-time tour state
 */
export const useFirstTimeTour = (featureKey) => {
  const [hasSeenTour, setHasSeenTour] = useState(false);

  useEffect(() => {
    if (!featureKey) return;

    const seen = localStorage.getItem(`firstTimeTour_${featureKey}`);
    setHasSeenTour(!!seen);
  }, [featureKey]);

  const markAsSeen = () => {
    if (featureKey) {
      localStorage.setItem(`firstTimeTour_${featureKey}`, 'true');
      setHasSeenTour(true);
    }
  };

  const reset = () => {
    if (featureKey) {
      localStorage.removeItem(`firstTimeTour_${featureKey}`);
      setHasSeenTour(false);
    }
  };

  return { hasSeenTour, markAsSeen, reset };
};

export default FirstTimeTooltip;

