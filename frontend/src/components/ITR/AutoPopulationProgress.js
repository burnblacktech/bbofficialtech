// =====================================================
// AUTO-POPULATION PROGRESS COMPONENT
// Shows progress indicator during auto-population and completion summary
// =====================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DATA_SOURCE_LABELS } from '../../services/AutoPopulationService';

const AutoPopulationProgress = ({
  isActive = false,
  summary = null,
  onDismiss = null,
  onRefresh = null,
  className = '',
}) => {
  if (!isActive && !summary) return null;

  return (
    <AnimatePresence>
      {(isActive || summary) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            'bg-white border border-neutral-200 rounded-xl shadow-elevation-1 p-4',
            className,
          )}
        >
          {isActive ? (
            <div className="flex items-center gap-3">
              <Loader className="w-5 h-5 text-gold-600 animate-spin" />
              <div className="flex-1">
                <div className="text-body-regular font-medium text-neutral-900">Auto-filling data...</div>
                <div className="text-body-small text-neutral-500 mt-0.5">
                  Fetching from AIS/26AS, Form 16, and previous year data
                </div>
              </div>
            </div>
          ) : summary && summary.autoFilledCount > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-body-regular font-medium text-neutral-900">
                      Auto-filled {summary.autoFilledCount} field{summary.autoFilledCount !== 1 ? 's' : ''}
                    </div>
                    <div className="text-body-small text-neutral-500 mt-0.5">
                      From {Object.keys(summary.bySource).length} source{Object.keys(summary.bySource).length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onRefresh && (
                    <button
                      onClick={onRefresh}
                      className="p-1.5 rounded-xl hover:bg-neutral-100 transition-colors"
                      title="Refresh from sources"
                    >
                      <RefreshCw className="w-4 h-4 text-neutral-600" />
                    </button>
                  )}
                  {onDismiss && (
                    <button
                      onClick={onDismiss}
                      className="p-1.5 rounded-xl hover:bg-neutral-100 transition-colors"
                      title="Dismiss"
                    >
                      <X className="w-4 h-4 text-neutral-600" />
                    </button>
                  )}
                </div>
              </div>

              {Object.keys(summary.bySource).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(summary.bySource).map(([source, count]) => (
                    <div
                      key={source}
                      className="px-2 py-1 bg-neutral-50 rounded-xl text-body-small font-medium text-neutral-700"
                    >
                      {DATA_SOURCE_LABELS[source] || source}: {count}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AutoPopulationProgress;

