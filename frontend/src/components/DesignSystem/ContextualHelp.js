// BurnBlack Contextual Help System
// Implements LYRA method progressive disclosure and smart defaults
// Provides plain-English help without jargon

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  BookOpen,
  MessageCircle,
  Bot,
} from 'lucide-react';

// =====================================================
// CONTEXTUAL HELP COMPONENTS
// =====================================================

// Smart Help Tooltip
export const SmartHelpTooltip = ({
  children,
  helpText,
  detailedHelp,
  showAIAssistant = true,
  placement = 'top',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);

  return (
    <div className="relative inline-block" {...props}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`
              absolute z-50 bg-gray-900 text-white text-sm rounded-lg p-4 shadow-xl max-w-sm
              ${placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
              ${placement === 'left' ? 'right-full mr-2' : 'left-0'}
            `}
          >
            <div className="relative">
              <div className="flex items-start justify-between mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="mb-3">{helpText}</p>

              {detailedHelp && (
                <div className="mb-3">
                  <button
                    onClick={() => setShowDetailed(!showDetailed)}
                    className="flex items-center text-blue-400 hover:text-blue-300 text-xs"
                  >
                    {showDetailed ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                    {showDetailed ? 'Show less' : 'Learn more'}
                  </button>

                  <AnimatePresence>
                    {showDetailed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 text-xs text-gray-300"
                      >
                        {detailedHelp}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {showAIAssistant && (
                <div className="border-t border-gray-700 pt-2">
                  <button className="flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    <Bot className="w-3 h-3 mr-1" />
                    Ask AI Assistant
                  </button>
                </div>
              )}

              {/* Arrow */}
              <div className={`
                absolute w-2 h-2 bg-gray-900 transform rotate-45
                ${placement === 'top' ? 'top-full -mt-1' : 'bottom-full -mb-1'}
                left-4
              `} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Inline Help Component
export const InlineHelp = ({
  label,
  helpText,
  children,
  required = false,
  ...props
}) => {
  return (
    <div className="space-y-2" {...props}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <SmartHelpTooltip helpText={helpText}>
          <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
        </SmartHelpTooltip>
      </div>
      {children}
    </div>
  );
};

// Progressive Disclosure Component
export const ProgressiveDisclosure = ({
  title,
  summary,
  details,
  defaultExpanded = false,
  onToggle,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggle && onToggle(!isExpanded);
  };

  return (
    <div className="border border-gray-200 rounded-lg" {...props}>
      <button
        onClick={handleToggle}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
      >
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{summary}</p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200"
          >
            <div className="px-4 py-3">
              {details}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Smart Defaults Component
export const SmartDefaults = ({
  suggestions,
  onApply,
  onDismiss,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleApply = (suggestion) => {
    onApply && onApply(suggestion);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    onDismiss && onDismiss();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"
      {...props}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="font-medium text-blue-900">Smart Suggestions</h3>
        </div>
        <button
          onClick={handleDismiss}
          className="text-blue-400 hover:text-blue-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{suggestion.title}</p>
              <p className="text-xs text-gray-600">{suggestion.description}</p>
            </div>
            <button
              onClick={() => handleApply(suggestion)}
              className="ml-3 bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Contextual Help Panel
export const ContextualHelpPanel = ({
  isOpen,
  onClose,
  title,
  content,
  relatedTopics = [],
  ...props
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center">
                <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="prose prose-sm max-w-none">
                {content}
              </div>

              {relatedTopics.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Related Topics</h3>
                  <div className="space-y-2">
                    {relatedTopics.map((topic, index) => (
                      <button
                        key={index}
                        className="block w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <button className="flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors">
                <MessageCircle className="w-4 h-4 mr-1" />
                Contact Support
              </button>
              <button className="flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors">
                <Bot className="w-4 h-4 mr-1" />
                Ask AI Assistant
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Help Content Database
export const HELP_CONTENT = {
  'pan-verification': {
    title: 'PAN Verification',
    summary: 'Verify your PAN details before filing',
    helpText: 'Your PAN (Permanent Account Number) is required for all tax filings. We\'ll verify it with government records.',
    detailedHelp: 'PAN verification ensures your tax return is processed correctly. We use secure government APIs to validate your details instantly.',
  },
  'income-sources': {
    title: 'Income Sources',
    summary: 'Add all your income sources for the year',
    helpText: 'Include salary, business income, capital gains, and other earnings. We\'ll help you categorize them correctly.',
    detailedHelp: 'Different income types have different tax treatments. Salary income is taxed at slab rates, while capital gains have special rates. We\'ll guide you through each category.',
  },
  'deductions': {
    title: 'Tax Deductions',
    summary: 'Claim eligible deductions to reduce your tax',
    helpText: 'Deductions like 80C (LIC, PPF), 80D (health insurance), and HRA can significantly reduce your tax liability.',
    detailedHelp: 'Section 80C allows up to ₹1.5L deduction for investments like LIC, PPF, ELSS. Section 80D provides deduction for health insurance premiums. HRA depends on your salary and rent paid.',
  },
  'filing-status': {
    title: 'Filing Status',
    summary: 'Track your filing progress and status',
    helpText: 'Monitor your ITR filing from draft to submission to acknowledgment receipt.',
    detailedHelp: 'After submission, you\'ll receive an acknowledgment number. Track refund status and any notices from the tax department through our dashboard.',
  },
};

// Help Hook for Easy Access
export const useHelp = () => {
  const [helpPanelOpen, setHelpPanelOpen] = useState(false);
  const [currentHelp, setCurrentHelp] = useState(null);

  const showHelp = (helpKey) => {
    setCurrentHelp(HELP_CONTENT[helpKey]);
    setHelpPanelOpen(true);
  };

  const hideHelp = () => {
    setHelpPanelOpen(false);
    setCurrentHelp(null);
  };

  return {
    showHelp,
    hideHelp,
    helpPanelOpen,
    currentHelp,
  };
};

export default {
  SmartHelpTooltip,
  InlineHelp,
  ProgressiveDisclosure,
  SmartDefaults,
  ContextualHelpPanel,
  HELP_CONTENT,
  useHelp,
};
