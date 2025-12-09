import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Info,
  ArrowRight,
  X,
} from 'lucide-react';

const AISuggestionChip = ({ suggestion, onClick, onDismiss }) => {
  const getIcon = () => {
    switch (suggestion.type) {
      case 'deduction_opportunity':
        return TrendingUp;
      case 'optimization':
        return TrendingUp;
      case 'inconsistency':
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const getColorClasses = () => {
    switch (suggestion.priority) {
      case 'high':
        return {
          bg: 'bg-gold-100',
          border: 'border-gold-200',
          text: 'text-gold-800',
          icon: 'text-gold-600',
          button: 'bg-gold-600 hover:bg-gold-700',
        };
      case 'medium':
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700',
        };
      case 'low':
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: 'text-gray-600',
          button: 'bg-gray-600 hover:bg-gray-700',
        };
      default:
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700',
        };
    }
  };

  const Icon = getIcon();
  const colors = getColorClasses();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${colors.bg} ${colors.border} ${colors.text} max-w-sm`}
    >
      {/* Icon */}
      <Icon className={`h-4 w-4 ${colors.icon} flex-shrink-0`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{suggestion.title}</p>
        {suggestion.estimatedSavings && (
          <p className="text-xs opacity-75">
            Save ₹{suggestion.estimatedSavings.toLocaleString()}
          </p>
        )}
      </div>

      {/* Action Button */}
      {suggestion.actionable && onClick && (
        <button
          onClick={onClick}
          className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium text-white ${colors.button} transition-colors`}
        >
          <span>View</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      )}

      {/* Dismiss Button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </motion.div>
  );
};

export default AISuggestionChip;
