/**
 * ImportReviewScreen — Review extracted data before confirming import
 *
 * Displays extracted fields grouped by section (Salary, Other Income, Deductions, Taxes Paid).
 * Shows conflict cards with side-by-side comparison and resolution controls.
 * All auto-filled values are editable inline.
 * Confirm sends PUT /api/filings/:filingId/import/confirm.
 * Cancel discards everything and closes the modal.
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, AlertTriangle, Edit3, Loader2, ChevronDown, ChevronRight, Info,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../../services/api';
import P from '../../../../styles/palette';

// ── Source badge config (matches ImportDocumentModal card colors) ──
const SOURCE_CONFIG = {
  form16: { label: 'Form 16', color: '#059669', bg: '#f0fdf4' },
  '26as': { label: '26AS', color: '#2563eb', bg: '#eff6ff' },
  ais: { label: 'AIS', color: '#7c3aed', bg: '#f5f3ff' },
  manual: { label: 'Manual', color: '#6b7280', bg: '#f3f4f6' },
};

// ── Section display order ──
const SECTION_ORDER = ['Salary', 'Other Income', 'Deductions', 'Taxes Paid'];

// ── Animation variants ──
const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// ── Helper: format currency ──
function fmtCurrency(v) {
  const num = Number(v);
  if (Number.isNaN(num)) return String(v);
  return `₹${Math.abs(num).toLocaleString('en-IN')}`;
}

// ── Helper: check if value is numeric ──
function isNumeric(v) {
  return v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v));
}

// ── Source Badge component ──
function SourceBadge({ source }) {
  const cfg = SOURCE_CONFIG[source] || SOURCE_CONFIG.manual;
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: 10,
      color: cfg.color,
      background: cfg.bg,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

// ── Inline editable field ──
function EditableField({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    // Convert back to number if original was numeric
    if (isNumeric(trimmed) && isNumeric(value)) {
      onChange(Number(trimmed));
    } else {
      onChange(trimmed);
    }
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(String(value ?? '')); setEditing(false); } }}
        style={styles.inlineInput}
      />
    );
  }

  return (
    <span
      style={styles.editableValue}
      onClick={() => { setDraft(String(value ?? '')); setEditing(true); }}
      title="Click to edit"
    >
      {isNumeric(value) ? fmtCurrency(value) : String(value ?? '—')}
      <Edit3 size={11} style={{ marginLeft: 4, color: P.textLight, flexShrink: 0 }} />
    </span>
  );
}

// ── Conflict Card ──
function ConflictCard({ conflict, resolution, onResolve }) {
  const { fieldPath, fieldLabel, existingValue, existingSource, newValue, newSource, difference, recommendation, reason } = conflict;
  const isRecommendedExisting = recommendation === existingSource;
  const isRecommendedNew = recommendation === newSource;

  const selected = resolution?.choice; // 'existing' | 'new' | 'custom'
  const customValue = resolution?.customValue ?? '';

  const existingCfg = SOURCE_CONFIG[existingSource] || SOURCE_CONFIG.manual;
  const newCfg = SOURCE_CONFIG[newSource] || SOURCE_CONFIG.manual;

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" style={styles.conflictCard}>
      <div style={styles.conflictHeader}>
        <AlertTriangle size={14} style={{ color: P.warning, flexShrink: 0 }} />
        <span style={styles.conflictLabel}>{fieldLabel || fieldPath}</span>
        {difference != null && isNumeric(difference) && (
          <span style={styles.conflictDiff}>Δ {fmtCurrency(difference)}</span>
        )}
      </div>

      {reason && (
        <div style={styles.conflictReason}>
          <Info size={11} style={{ color: P.textLight, flexShrink: 0, marginTop: 1 }} />
          <span>{reason}</span>
        </div>
      )}

      {/* Side-by-side comparison */}
      <div style={styles.conflictCompare}>
        {/* Existing value */}
        <label
          style={{
            ...styles.conflictOption,
            borderColor: selected === 'existing' ? existingCfg.color : P.borderLight,
            background: selected === 'existing' ? existingCfg.bg : P.bgCard,
          }}
          onClick={() => onResolve({ choice: 'existing', value: existingValue })}
        >
          <input
            type="radio"
            name={`conflict-${fieldPath}`}
            checked={selected === 'existing'}
            onChange={() => onResolve({ choice: 'existing', value: existingValue })}
            style={styles.radio}
          />
          <div style={{ flex: 1 }}>
            <div style={styles.conflictOptionHeader}>
              <span style={{ fontSize: 11, color: P.textMuted }}>Current</span>
              <SourceBadge source={existingSource} />
              {isRecommendedExisting && <span style={styles.recommendedBadge}>Recommended</span>}
            </div>
            <div style={styles.conflictOptionValue}>
              {isNumeric(existingValue) ? fmtCurrency(existingValue) : String(existingValue ?? '—')}
            </div>
          </div>
        </label>

        {/* New value */}
        <label
          style={{
            ...styles.conflictOption,
            borderColor: selected === 'new' ? newCfg.color : P.borderLight,
            background: selected === 'new' ? newCfg.bg : P.bgCard,
          }}
          onClick={() => onResolve({ choice: 'new', value: newValue })}
        >
          <input
            type="radio"
            name={`conflict-${fieldPath}`}
            checked={selected === 'new'}
            onChange={() => onResolve({ choice: 'new', value: newValue })}
            style={styles.radio}
          />
          <div style={{ flex: 1 }}>
            <div style={styles.conflictOptionHeader}>
              <span style={{ fontSize: 11, color: P.textMuted }}>New</span>
              <SourceBadge source={newSource} />
              {isRecommendedNew && <span style={styles.recommendedBadge}>Recommended</span>}
            </div>
            <div style={styles.conflictOptionValue}>
              {isNumeric(newValue) ? fmtCurrency(newValue) : String(newValue ?? '—')}
            </div>
          </div>
        </label>
      </div>

      {/* Custom value option */}
      <label
        style={{
          ...styles.customOption,
          borderColor: selected === 'custom' ? P.brand : P.borderLight,
          background: selected === 'custom' ? P.brandLight : P.bgCard,
        }}
        onClick={() => onResolve({ choice: 'custom', value: customValue || '' })}
      >
        <input
          type="radio"
          name={`conflict-${fieldPath}`}
          checked={selected === 'custom'}
          onChange={() => onResolve({ choice: 'custom', value: customValue || '' })}
          style={styles.radio}
        />
        <span style={{ fontSize: 12, color: P.textSecondary, marginRight: 8 }}>Custom:</span>
        <input
          type="text"
          value={customValue}
          placeholder="Enter value"
          onChange={(e) => onResolve({ choice: 'custom', value: e.target.value, customValue: e.target.value })}
          onFocus={() => { if (selected !== 'custom') onResolve({ choice: 'custom', value: customValue || '' }); }}
          style={styles.customInput}
        />
      </label>
    </motion.div>
  );
}

// ── Section group component ──
function SectionGroup({ title, fields, editedValues, onEditField, documentType }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!fields.length) return null;

  return (
    <div style={styles.sectionGroup}>
      <button style={styles.sectionHeader} onClick={() => setCollapsed(!collapsed)}>
        <span style={styles.sectionTitle}>{title}</span>
        <span style={styles.sectionCount}>{fields.length} field{fields.length !== 1 ? 's' : ''}</span>
        {collapsed ? <ChevronRight size={14} style={{ color: P.textLight }} /> : <ChevronDown size={14} style={{ color: P.textLight }} />}
      </button>
      {!collapsed && (
        <div style={styles.sectionBody}>
          {fields.map(({ fieldPath, label, value }) => {
            const currentValue = editedValues[fieldPath] !== undefined ? editedValues[fieldPath] : value;
            return (
              <div key={fieldPath} style={styles.fieldRow}>
                <div style={styles.fieldLabel}>
                  <span>{label}</span>
                  <SourceBadge source={documentType} />
                </div>
                <EditableField
                  value={currentValue}
                  onChange={(newVal) => onEditField(fieldPath, newVal)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ──
export default function ImportReviewScreen({
  extractedData,
  conflicts,
  fieldMapping,
  documentMeta,
  documentType,
  fileName,
  fileContent,
  filingId,
  onClose,
  onConfirmed,
  warnings,
}) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [editedValues, setEditedValues] = useState({});
  const [conflictResolutions, setConflictResolutions] = useState(() => {
    // Pre-select recommended source for each conflict
    const initial = {};
    (conflicts || []).forEach((c) => {
      if (c.recommendation) {
        const choice = c.recommendation === c.existingSource ? 'existing' : 'new';
        const value = choice === 'existing' ? c.existingValue : c.newValue;
        initial[c.fieldPath] = { choice, value };
      }
    });
    return initial;
  });

  const requiresConfirmation = documentMeta?.requiresConfirmation === true;
  const hasConflicts = conflicts && conflicts.length > 0;

  // Group extracted fields by section
  const groupedFields = useMemo(() => {
    const groups = {};
    SECTION_ORDER.forEach((s) => { groups[s] = []; });
    groups.Other = []; // catch-all

    if (!extractedData || !fieldMapping) return groups;

    // Exclude fields that are in conflicts (they get their own cards)
    const conflictPaths = new Set((conflicts || []).map((c) => c.fieldPath));

    Object.entries(extractedData).forEach(([fieldPath, value]) => {
      if (conflictPaths.has(fieldPath)) return;
      const mapping = fieldMapping[fieldPath];
      const section = mapping?.section || 'Other';
      const label = mapping?.label || fieldPath;
      const target = groups[section] || groups.Other;
      target.push({ fieldPath, label, value });
    });

    return groups;
  }, [extractedData, fieldMapping, conflicts]);

  // Handle field edits
  const handleEditField = useCallback((fieldPath, newValue) => {
    setEditedValues((prev) => ({ ...prev, [fieldPath]: newValue }));
  }, []);

  // Handle conflict resolution
  const handleResolveConflict = useCallback((fieldPath, resolution) => {
    setConflictResolutions((prev) => ({
      ...prev,
      [fieldPath]: {
        choice: resolution.choice,
        value: resolution.value,
        customValue: resolution.customValue ?? prev[fieldPath]?.customValue,
      },
    }));
  }, []);

  // Check if all conflicts are resolved
  const allConflictsResolved = useMemo(() => {
    if (!hasConflicts) return true;
    return conflicts.every((c) => {
      const res = conflictResolutions[c.fieldPath];
      if (!res) return false;
      if (res.choice === 'custom' && (res.value === '' || res.value == null)) return false;
      return true;
    });
  }, [conflicts, conflictResolutions, hasConflicts]);

  // Build resolved data for confirm
  const buildResolvedData = useCallback(() => {
    const resolved = {};

    // Start with all extracted data
    if (extractedData) {
      Object.entries(extractedData).forEach(([path, value]) => {
        resolved[path] = editedValues[path] !== undefined ? editedValues[path] : value;
      });
    }

    // Apply conflict resolutions
    (conflicts || []).forEach((c) => {
      const res = conflictResolutions[c.fieldPath];
      if (res) {
        let val = res.value;
        if (res.choice === 'custom' && isNumeric(val) && isNumeric(c.existingValue)) {
          val = Number(val);
        }
        resolved[c.fieldPath] = val;
      }
    });

    return resolved;
  }, [extractedData, editedValues, conflicts, conflictResolutions]);

  // Confirm import
  const handleConfirm = async () => {
    if (!allConflictsResolved) {
      toast.error('Please resolve all conflicts before confirming.');
      return;
    }

    setConfirming(true);
    try {
      const resolvedData = buildResolvedData();
      await api.put(`/filings/${filingId}/import/confirm`, {
        resolvedData,
        documentType,
        fileName,
        fileContent,
      });

      // Invalidate filing query cache to refresh all editors
      queryClient.invalidateQueries({ queryKey: ['filing', filingId] });

      toast.success('Import confirmed! Your filing data has been updated.');

      if (onConfirmed) onConfirmed();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to confirm import. Please try again.';
      toast.error(msg);
    } finally {
      setConfirming(false);
    }
  };

  const fieldCount = extractedData ? Object.keys(extractedData).length : 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Review Imported Data</h2>
          <p style={styles.subtitle}>
            {fieldCount} field{fieldCount !== 1 ? 's' : ''} extracted from {fileName || documentType}
          </p>
        </div>
        <button style={styles.closeBtn} onClick={onClose} title="Cancel import">
          <X size={18} />
        </button>
      </div>

      {/* Re-import warning */}
      {requiresConfirmation && (
        <motion.div variants={fadeIn} initial="hidden" animate="visible" style={styles.warningBanner}>
          <AlertTriangle size={16} style={{ color: P.warning, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>Re-import detected</div>
            <div style={{ fontSize: 12, color: '#a16207', marginTop: 2 }}>
              You have previously imported a {SOURCE_CONFIG[documentType]?.label || documentType} document.
              Confirming will replace the previously imported data from this source.
            </div>
          </div>
        </motion.div>
      )}

      {/* Scrollable body */}
      <div style={styles.body}>
        {/* Parse warnings */}
        {warnings && warnings.length > 0 && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <AlertTriangle size={14} style={{ color: '#d97706' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>Parsing Warnings</span>
            </div>
            {warnings.map((w, i) => (
              <div key={i} style={{ fontSize: 12, color: '#a16207', marginLeft: 20, lineHeight: 1.5 }}>• {w}</div>
            ))}
            <div style={{ fontSize: 11, color: '#a16207', marginTop: 6, marginLeft: 20 }}>
              Some fields may not have been extracted. Please verify the data below before confirming.
            </div>
          </div>
        )}
        {/* Conflicts section */}
        {hasConflicts && (
          <div style={styles.conflictsSection}>
            <div style={styles.conflictsSectionHeader}>
              <AlertTriangle size={14} style={{ color: P.warning }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: P.textPrimary }}>
                {conflicts.length} Conflict{conflicts.length !== 1 ? 's' : ''} Found
              </span>
              <span style={{ fontSize: 12, color: P.textMuted }}>
                Choose which value to keep for each field
              </span>
            </div>
            {conflicts.map((conflict) => (
              <ConflictCard
                key={conflict.fieldPath}
                conflict={conflict}
                resolution={conflictResolutions[conflict.fieldPath]}
                onResolve={(res) => handleResolveConflict(conflict.fieldPath, res)}
              />
            ))}
          </div>
        )}

        {/* Extracted data grouped by section */}
        <AnimatePresence>
          {SECTION_ORDER.map((section) => (
            <SectionGroup
              key={section}
              title={section}
              fields={groupedFields[section] || []}
              editedValues={editedValues}
              onEditField={handleEditField}
              documentType={documentType}
            />
          ))}
          {(groupedFields.Other || []).length > 0 && (
            <SectionGroup
              title="Other"
              fields={groupedFields.Other}
              editedValues={editedValues}
              onEditField={handleEditField}
              documentType={documentType}
            />
          )}
        </AnimatePresence>

        {/* Empty state */}
        {fieldCount === 0 && !hasConflicts && (
          <div style={styles.emptyState}>
            <Info size={24} style={{ color: P.textLight }} />
            <div style={{ fontSize: 13, color: P.textMuted, marginTop: 8 }}>
              No data was extracted from this document.
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={styles.footer}>
        <button style={styles.cancelBtn} onClick={onClose} disabled={confirming}>
          Cancel
        </button>
        <button
          style={{
            ...styles.confirmBtn,
            opacity: (!allConflictsResolved || confirming) ? 0.6 : 1,
            cursor: (!allConflictsResolved || confirming) ? 'not-allowed' : 'pointer',
          }}
          onClick={handleConfirm}
          disabled={!allConflictsResolved || confirming}
        >
          {confirming ? (
            <>
              <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
              Confirming...
            </>
          ) : (
            <>
              <Check size={14} />
              Confirm Import
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Styles ──
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '90vh',
    background: P.bgCard,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '24px 24px 16px',
    borderBottom: `1px solid ${P.borderLight}`,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: P.textPrimary,
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: P.textMuted,
    margin: '4px 0 0',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: P.textMuted,
    padding: 4,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'auto',
    minWidth: 'auto',
  },
  warningBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    margin: '16px 24px 0',
    padding: '12px 14px',
    background: P.warningBg,
    border: '1px solid #fde68a',
    borderRadius: 10,
  },
  body: {
    flex: 1,
    overflow: 'auto',
    padding: '16px 24px',
  },
  conflictsSection: {
    marginBottom: 20,
  },
  conflictsSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  conflictCard: {
    border: '1px solid #fde68a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    background: '#fffdf7',
  },
  conflictHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  conflictLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: P.textPrimary,
    flex: 1,
  },
  conflictDiff: {
    fontSize: 11,
    fontWeight: 600,
    color: P.warning,
    background: P.warningBg,
    padding: '2px 8px',
    borderRadius: 8,
  },
  conflictReason: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 6,
    fontSize: 11,
    color: P.textMuted,
    marginBottom: 10,
    lineHeight: 1.4,
  },
  conflictCompare: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 8,
  },
  conflictOption: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    border: '1.5px solid',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
  },
  conflictOptionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  conflictOptionValue: {
    fontSize: 15,
    fontWeight: 700,
    color: P.textPrimary,
  },
  recommendedBadge: {
    fontSize: 9,
    fontWeight: 700,
    color: '#fff',
    background: P.brand,
    padding: '1px 6px',
    borderRadius: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  radio: {
    marginTop: 2,
    accentColor: P.brand,
    cursor: 'pointer',
  },
  customOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    border: '1.5px solid',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
  },
  customInput: {
    flex: 1,
    border: `1px solid ${P.borderLight}`,
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 13,
    color: P.textPrimary,
    outline: 'none',
    background: P.bgCard,
    minWidth: 0,
  },
  sectionGroup: {
    marginBottom: 12,
    border: `1px solid ${P.borderLight}`,
    borderRadius: 10,
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '12px 14px',
    background: P.bgMuted,
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    minHeight: 'auto',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: P.textPrimary,
    flex: 1,
  },
  sectionCount: {
    fontSize: 11,
    color: P.textMuted,
    fontWeight: 500,
  },
  sectionBody: {
    padding: '4px 0',
  },
  fieldRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 14px',
    borderBottom: `1px solid ${P.borderLight}`,
    gap: 12,
  },
  fieldLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: P.textSecondary,
    flex: 1,
    minWidth: 0,
  },
  editableValue: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 13,
    fontWeight: 600,
    color: P.textPrimary,
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 6,
    border: '1px solid transparent',
    transition: 'border-color 0.15s, background 0.15s',
    whiteSpace: 'nowrap',
  },
  inlineInput: {
    fontSize: 13,
    fontWeight: 600,
    color: P.textPrimary,
    border: `1.5px solid ${P.brand}`,
    borderRadius: 6,
    padding: '2px 6px',
    outline: 'none',
    background: P.brandLight,
    width: 120,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 40,
    textAlign: 'center',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    padding: '16px 24px',
    borderTop: `1px solid ${P.borderLight}`,
    background: P.bgCard,
  },
  cancelBtn: {
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: 600,
    color: P.textSecondary,
    background: P.bgMuted,
    border: `1px solid ${P.borderLight}`,
    borderRadius: 8,
    cursor: 'pointer',
    minHeight: 'auto',
  },
  confirmBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
    background: P.brand,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    minHeight: 'auto',
  },
};
