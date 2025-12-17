// =====================================================
// AUTO-POPULATION ACTIONS COMPONENT
// Bulk actions for accepting/overriding auto-filled values
// =====================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

const AutoPopulationActions = ({
  autoFilledFields = {},
  onAcceptAll = null,
  onOverrideAll = null,
  onVerifyAll = null,
  className = '',
}) => {
  const [showActions, setShowActions] = useState(false);

  const totalAutoFilled = Object.values(autoFilledFields).reduce(
    (sum, fields) => sum + (fields?.length || 0),
    0,
  );

  if (totalAutoFilled === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <button
        onClick={() => setShowActions(!showActions)}
        className="w-full flex items-center justify-between px-3 py-2 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-colors text-body-regular font-medium text-neutral-700"
      >
        <span>Bulk Actions ({totalAutoFilled} auto-filled fields)</span>
        <motion.div
          animate={{ rotate: showActions ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <AlertTriangle className="w-4 h-4" />
        </motion.div>
      </button>

      {showActions && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          {onAcceptAll && (
            <button
              onClick={() => {
                onAcceptAll();
                setShowActions(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors text-body-regular font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Accept All Auto-filled Values</span>
            </button>
          )}

          {onOverrideAll && (
            <button
              onClick={() => {
                onOverrideAll();
                setShowActions(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-colors text-body-regular font-medium"
            >
              <XCircle className="w-4 h-4" />
              <span>Override All with Manual Entry</span>
            </button>
          )}

          {onVerifyAll && (
            <button
              onClick={() => {
                onVerifyAll();
                setShowActions(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors text-body-regular font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Verify All Fields</span>
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AutoPopulationActions;

