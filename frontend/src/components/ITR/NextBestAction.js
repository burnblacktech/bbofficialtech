// =====================================================
// NEXT BEST ACTION STRIP
// Lightweight contextual action suggestions based on filing state
// =====================================================

import { Edit3, Calculator, FileCheck, CheckCircle, ArrowRight } from 'lucide-react';

const NextBestAction = ({ blueprint, onActionClick }) => {
  if (!blueprint || !blueprint.filingState) {
    return null;
  }

  const { allowedActions, filingState } = blueprint;
  const actions = [];

  // Determine primary action based on allowedActions priority
  // Priority: file_itr > compute_tax > edit_data
  if (allowedActions?.includes('file_itr') && filingState?.canFile) {
    const gate = filingState?.submissionGate || { ok: true }; // Default true if not provided (legacy compatibility)
    const isGateOpen = gate.ok;

    actions.push({
      type: 'primary',
      icon: isGateOpen ? FileCheck : FileCheck, // Could verify icon status
      label: isGateOpen ? 'File my return' : 'Complete details to file',
      description: isGateOpen
        ? 'Review your story and submit to ITD'
        : 'Final step before submission',
      action: 'file_itr',
      color: isGateOpen ? 'green' : 'slate',
      disabled: !isGateOpen,
      helperText: !isGateOpen ? "We'll submit only after these are completed." : null
    });
  } else if (allowedActions?.includes('compute_tax') && filingState?.canCompute) {
    actions.push({
      type: 'primary',
      icon: Calculator,
      label: 'Compute tax',
      description: 'Calculate your tax liability',
      action: 'compute_tax',
      color: 'blue',
    });
  } else if (allowedActions?.includes('edit_data') && filingState?.canEdit) {
    actions.push({
      type: 'primary',
      icon: Edit3,
      label: 'Add or review details',
      description: 'Complete your filing information',
      action: 'edit_data',
      color: 'slate',
    });
  }

  // Determine secondary action (different from primary)
  if (actions.length > 0) {
    const primaryAction = actions[0].action;
    if (primaryAction !== 'compute_tax' && allowedActions?.includes('compute_tax') && filingState?.canCompute) {
      actions.push({
        type: 'secondary',
        icon: Calculator,
        label: 'Compute tax',
        action: 'compute_tax',
        color: 'slate',
      });
    } else if (primaryAction !== 'edit_data' && allowedActions?.includes('edit_data') && filingState?.canEdit) {
      actions.push({
        type: 'secondary',
        icon: Edit3,
        label: 'Review details',
        action: 'edit_data',
        color: 'slate',
      });
    }
  }

  if (actions.length === 0) {
    return null;
  }

  const primaryAction = actions.find(a => a.type === 'primary');
  const secondaryAction = actions.find(a => a.type === 'secondary');

  // Color classes
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="text-body-small text-slate-600 mb-2">Next best action</div>
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Primary Action */}
        {primaryAction && (
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={primaryAction.disabled}
              onClick={() => !primaryAction.disabled && onActionClick && onActionClick(primaryAction.action)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all w-full sm:w-auto justify-center
                ${primaryAction.disabled
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : `cursor-pointer hover:shadow-md active:scale-[0.99] ${colorClasses[primaryAction.color] || colorClasses.slate}`
                }`}
            >
              {primaryAction.icon && (
                <primaryAction.icon className={`w-5 h-5 flex-shrink-0 ${primaryAction.disabled ? 'text-slate-400' : ''}`} />
              )}
              <div className="flex-1 min-w-0 text-left">
                <div className="text-body-medium font-semibold">{primaryAction.label}</div>
                {!primaryAction.disabled && primaryAction.description && (
                  <div className="text-body-small opacity-75 mt-0.5">{primaryAction.description}</div>
                )}
              </div>
              {!primaryAction.disabled && <ArrowRight className="w-4 h-4 opacity-50 flex-shrink-0" />}
            </button>
            {primaryAction.disabled && primaryAction.helperText && (
              <p className="text-xs text-slate-500 text-center sm:text-left px-1">
                {primaryAction.helperText}
              </p>
            )}
          </div>
        )}

        {/* Secondary Action */}
        {secondaryAction && (
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colorClasses[secondaryAction.color] || colorClasses.slate}`}
          >
            {secondaryAction.icon && (
              <secondaryAction.icon className="w-4 h-4 flex-shrink-0" />
            )}
            <div className="text-body-small font-medium">{secondaryAction.label}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NextBestAction;

