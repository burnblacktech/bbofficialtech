// =====================================================
// CELEBRATIONS & REWARDS COMPONENTS
// Behavioral psychology-driven celebration components
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, Star, Award } from 'lucide-react';

// Ultra-refined Micro-Celebration with behavioral psychology
export const MicroCelebration = ({
  trigger,
  message,
  type = 'success',
  duration = 3000,
  position = 'top-right',
  animated = true,
  className = '',
  ...props
}) => {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (trigger) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), duration);
      return () => clearTimeout(timer);
    }
  }, [trigger, duration]);

  if (!show) return null;

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-success-500',
      textColor: 'text-white',
      iconColor: 'text-white',
      shadowColor: 'shadow-glow-success'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-warning-500',
      textColor: 'text-white',
      iconColor: 'text-white',
      shadowColor: 'shadow-glow-warning'
    },
    info: {
      icon: Info,
      bgColor: 'bg-primary-500',
      textColor: 'text-white',
      iconColor: 'text-white',
      shadowColor: 'shadow-glow'
    }
  };

  const { icon: Icon, bgColor, textColor, iconColor, shadowColor } = config[type];

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className={`fixed z-50 ${positionClasses[position]} ${className}`}
      {...props}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`
          ${bgColor} ${textColor} px-6 py-4 rounded-xl shadow-lg flex items-center gap-3
          ${shadowColor} border-2 border-white/20 backdrop-blur-sm
          ${animated ? 'hover:scale-105 transition-all duration-300' : ''}
        `}
      >
        <motion.div
          initial={{ rotate: -180 }}
          animate={{ rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </motion.div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{message}</span>
          <span className="text-xs opacity-90">Great job!</span>
        </div>

        {/* Animated particles */}
        {animated && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: Math.cos(i * 60 * Math.PI / 180) * 20,
                  y: Math.sin(i * 60 * Math.PI / 180) * 20
                }}
                transition={{
                  delay: 0.3 + i * 0.1,
                  duration: 1.5,
                  ease: "easeOut"
                }}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Success Celebration Component
export const SuccessCelebration = ({ onShare, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 rounded-xl text-center"
      {...props}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 mx-auto mb-4"
      >
        <Star className="w-16 h-16" />
      </motion.div>

      <h3 className="text-2xl font-bold mb-2">🎉 Filing Complete!</h3>
      <p className="text-lg mb-4">You're compliant with IT rules, securely filed.</p>

      <div className="flex justify-center space-x-4">
        <button
          onClick={onShare}
          className="bg-white text-green-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          Share Success
        </button>
        <button className="bg-white bg-opacity-20 text-white px-6 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors">
          Download Certificate
        </button>
      </div>
    </motion.div>
  );
};

// Emotional State Indicator
export const EmotionalStateIndicator = ({ state, message, ...props }) => {
  const states = {
    'anxiety': {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    'confidence': {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    'relief': {
      icon: Award,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  };

  const stateConfig = states[state];
  const IconComponent = stateConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex items-center p-4 rounded-lg border ${stateConfig.bgColor} ${stateConfig.borderColor}
      `}
      {...props}
    >
      <IconComponent className={`w-5 h-5 mr-3 ${stateConfig.color}`} />
      <p className={`font-medium ${stateConfig.color}`}>{message}</p>
    </motion.div>
  );
};

export default { MicroCelebration, SuccessCelebration, EmotionalStateIndicator };