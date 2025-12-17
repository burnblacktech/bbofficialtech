// =====================================================
// QUICK ACTION CARD - SECONDARY DASHBOARD ACTIONS
// Smaller cards with new Solar Gold / Ember palette
// =====================================================

import React from 'react';
import { ArrowRight } from 'lucide-react';

const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  onClick,
  color = 'primary',
  isComingSoon = false,
}) => {
  const colorClasses = {
    primary: {
      icon: 'bg-aurora-gradient',
      hover: 'hover:border-primary-200',
      text: 'text-primary-600',
    },
    ember: {
      icon: 'bg-ember-gradient',
      hover: 'hover:border-ember-200',
      text: 'text-ember-600',
    },
    blue: {
      icon: 'bg-gradient-to-br from-info-500 to-info-600',
      hover: 'hover:border-info-200',
      text: 'text-info-600',
    },
    green: {
      icon: 'bg-gradient-to-br from-success-500 to-success-600',
      hover: 'hover:border-success-200',
      text: 'text-success-600',
    },
    purple: {
      icon: 'bg-gradient-to-br from-regime-new to-regime-old',
      hover: 'hover:border-purple-200',
      text: 'text-purple-600',
    },
    orange: {
      icon: 'bg-aurora-gradient',
      hover: 'hover:border-ember-200',
      text: 'text-ember-600',
    },
    gold: {
      icon: 'bg-primary-gradient',
      hover: 'hover:border-primary-200',
      text: 'text-primary-600',
    },
    gray: {
      icon: 'bg-gradient-to-br from-slate-500 to-slate-600',
      hover: 'hover:border-slate-300',
      text: 'text-slate-600',
    },
  };

  const colors = colorClasses[color] || colorClasses.primary;

  return (
    <div
      className={`bg-white rounded-xl shadow-card border border-slate-200 ${colors.hover} hover:shadow-card-hover transition-all duration-200 cursor-pointer group ${
        isComingSoon ? 'opacity-60 cursor-not-allowed' : ''
      }`}
      onClick={!isComingSoon ? onClick : undefined}
    >
      <div className="p-4">
        {/* Icon + Title Row */}
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 ${colors.icon} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-elevation-1`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-slate-700 transition-colors flex items-center gap-2 flex-1 min-w-0">
            <span className="truncate">{title}</span>
            {isComingSoon && (
              <span className="text-body-small bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                Soon
              </span>
            )}
          </h3>
        </div>

        {/* Description */}
        <p className="text-body-small text-slate-500 mb-3 leading-relaxed line-clamp-2">
          {description}
        </p>

        {/* Action */}
        {!isComingSoon && (
          <div className={`flex items-center text-xs font-medium ${colors.text} group-hover:opacity-80 transition-all`}>
            <span>Get started</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickActionCard;
