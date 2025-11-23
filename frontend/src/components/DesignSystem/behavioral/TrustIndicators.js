// =====================================================
// TRUST INDICATORS COMPONENTS
// Behavioral psychology-driven trust components
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertTriangle, Info, Clock, DollarSign, Users, Star, Award, Lock, Eye } from 'lucide-react';
import { COLORS } from '../tokens';

// Ultra-refined Security Badge with enhanced trust indicators
export const SecurityBadge = ({
  type = 'verified',
  size = 'md',
  showIcon = true,
  className = '',
  animated = true
}) => {
  const config = {
    verified: {
      icon: Shield,
      text: 'Verified Secure',
      bgColor: 'bg-success-50',
      textColor: 'text-success-700',
      borderColor: 'border-success-200',
      iconColor: 'text-success-600'
    },
    encrypted: {
      icon: Lock,
      text: 'End-to-End Encrypted',
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-700',
      borderColor: 'border-primary-200',
      iconColor: 'text-primary-600'
    },
    compliant: {
      icon: CheckCircle,
      text: 'GDPR Compliant',
      bgColor: 'bg-secondary-50',
      textColor: 'text-secondary-700',
      borderColor: 'border-secondary-200',
      iconColor: 'text-secondary-600'
    },
    audit: {
      icon: Eye,
      text: 'Audit Ready',
      bgColor: 'bg-neutral-50',
      textColor: 'text-neutral-700',
      borderColor: 'border-neutral-200',
      iconColor: 'text-neutral-600'
    }
  };

  const { icon: Icon, text, bgColor, textColor, borderColor, iconColor } = config[type];

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center gap-2 rounded-lg border-2 font-medium
        ${bgColor} ${textColor} ${borderColor} ${sizeClasses[size]}
        ${animated ? 'transition-all duration-300 hover:scale-105 hover:shadow-md' : ''}
        ${className}
      `}
    >
      {showIcon && (
        <Icon
          className={`h-4 w-4 ${iconColor} ${animated ? 'animate-pulse-soft' : ''}`}
        />
      )}
      <span className="font-semibold">{text}</span>
    </motion.div>
  );
};

// Enhanced Trust Indicator with behavioral psychology
export const TrustIndicator = ({
  type,
  message,
  size = 'md',
  showIcon = true,
  animated = true,
  className = '',
  ...props
}) => {
  const indicators = {
    'eri-certified': {
      icon: Shield,
      text: 'Government ERI Certified',
      color: 'text-success-600',
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200'
    },
    'encrypted': {
      icon: Lock,
      text: '256-bit SSL Encrypted',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200'
    },
    'compliant': {
      icon: CheckCircle,
      text: 'IT Rules Compliant',
      color: 'text-success-600',
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200'
    },
    'audit-ready': {
      icon: Eye,
      text: 'Audit Ready',
      color: 'text-neutral-600',
      bgColor: 'bg-neutral-50',
      borderColor: 'border-neutral-200'
    }
  };

  const indicator = indicators[type];
  const IconComponent = indicator.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        inline-flex items-center gap-2 rounded-lg border-2 font-medium
        ${indicator.bgColor} ${indicator.color} ${indicator.borderColor}
        ${sizeClasses[size]}
        ${animated ? 'transition-all duration-300 hover:scale-105 hover:shadow-soft' : ''}
        ${className}
      `}
      {...props}
    >
      {showIcon && (
        <IconComponent
          className={`h-4 w-4 ${animated ? 'animate-pulse-soft' : ''}`}
        />
      )}
      <span className="font-semibold">{message || indicator.text}</span>
    </motion.div>
  );
};

export default { SecurityBadge, TrustIndicator };