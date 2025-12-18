// =====================================================
// REGIME TOGGLE COMPONENT
// Compact regime toggle for header with savings indicator
// =====================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../utils';

const RegimeToggle = ({
  regime,
  onRegimeChange,
  savings = null, // { amount: number, betterRegime: 'old' | 'new' }
  isLoading = false,
  className = '',
}) => {
  const handleToggle = () => {
    if (isLoading) return;
    onRegimeChange(regime === 'old' ? 'new' : 'old');
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-body-regular font-medium text-slate-600 hidden sm:inline">Tax Regime:</span>
      <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
        <button
          type="button"
          onClick={() => !isLoading && onRegimeChange('old')}
          disabled={isLoading}
          className={cn(
            'px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            regime === 'old'
              ? 'bg-white text-slate-900 shadow-elevation-1'
              : 'text-slate-600 hover:text-slate-900',
          )}
        >
          Old Regime
        </button>
        <button
          type="button"
          onClick={() => !isLoading && onRegimeChange('new')}
          disabled={isLoading}
          className={cn(
            'px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            regime === 'new'
              ? 'bg-white text-slate-900 shadow-elevation-1'
              : 'text-slate-600 hover:text-slate-900',
          )}
        >
          New Regime
        </button>
      </div>

      {savings && savings.amount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium',
            savings.betterRegime === 'new'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700',
          )}
        >
          {savings.betterRegime === 'new' ? (
            <TrendingDown className="w-3.5 h-3.5" />
          ) : (
            <TrendingUp className="w-3.5 h-3.5" />
          )}
          <span>
            Save ₹{savings.amount.toLocaleString('en-IN')} with {savings.betterRegime === 'new' ? 'New' : 'Old'} Regime
          </span>
        </motion.div>
      )}

      {isLoading && (
        <div className="flex items-center gap-1.5 text-body-small text-slate-500">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Calculator className="w-3.5 h-3.5" />
          </motion.div>
          <span>Calculating...</span>
        </div>
      )}
    </div>
  );
};

export default RegimeToggle;

