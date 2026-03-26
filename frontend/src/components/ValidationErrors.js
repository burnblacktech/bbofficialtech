/**
 * Validation Errors Display Component
 * Shows field-level errors inline
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { tokens } from '../styles/tokens';

const ValidationErrors = ({ errors }) => {
  if (!errors || Object.keys(errors).length === 0) return null;

  const errorList = Object.values(errors);

  return (
    <div style={{
      padding: tokens.spacing.md,
      backgroundColor: `${tokens.colors.error[600]}08`,
      border: `1px solid ${tokens.colors.error[200]}`,
      borderRadius: tokens.borderRadius.md,
      marginBottom: tokens.spacing.md,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: errorList.length > 1 ? tokens.spacing.sm : 0 }}>
        <AlertCircle size={16} color={tokens.colors.error[600]} />
        <span style={{ fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.error[900] }}>
          {errorList.length === 1 ? errorList[0] : `${errorList.length} issues found`}
        </span>
      </div>
      {errorList.length > 1 && (
        <ul style={{ margin: '0 0 0 24px', padding: 0, listStyle: 'disc' }}>
          {errorList.map((err, i) => (
            <li key={i} style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.error[700], marginBottom: '2px' }}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ValidationErrors;
