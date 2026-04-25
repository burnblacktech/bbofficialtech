/**
 * filingProgress — Shared filing progress computation.
 *
 * Used by Dashboard (filing cards) and Sidebar (File ITR badge).
 * Duplicates isSectionComplete logic from ITR1Flow to avoid circular imports.
 */

import { getCompletionInfo } from '../pages/Filing/ITR1/editors/PersonalInfoEditor';

const n = (v) => Number(v) || 0;

/**
 * Check if a filing section has meaningful data filled in.
 * Mirrors the logic in ITR1Flow.js isSectionComplete.
 */
export function isSectionComplete(id, payload) {
  const p = payload || {};
  switch (id) {
    case 'personalInfo':
      return getCompletionInfo(p.personalInfo || {}).complete;
    case 'salary':
      return (p.income?.salary?.employers || []).length > 0;
    case 'house_property':
      return p.income?.houseProperty?.type && !['none', 'NONE'].includes(p.income.houseProperty.type);
    case 'other':
      return n(p.income?.otherSources?.savingsInterest) + n(p.income?.otherSources?.fdInterest) + n(p.income?.otherSources?.dividendIncome) + n(p.income?.otherSources?.otherIncome) > 0;
    case 'capital_gains':
      return (p.income?.capitalGains?.transactions || []).length > 0;
    case 'business':
      return (p.income?.presumptive?.entries || []).length > 0 || (p.income?.business?.businesses || []).length > 0;
    case 'foreign':
      return (p.income?.foreignIncome?.incomes || []).length > 0;
    case 'deductions':
      return n(p.deductions?.ppf) + n(p.deductions?.elss) + n(p.deductions?.lic) + n(p.deductions?.nps) + n(p.deductions?.healthSelf) > 0;
    case 'bank':
      return !!(p.bankDetails?.bankName && p.bankDetails?.accountNumber);
    default:
      return false;
  }
}

/**
 * Compute filing progress from a filing object.
 * @param {object} filing - Filing object with jsonPayload
 * @returns {{ completed: number, total: number, percent: number }}
 */
export function computeFilingProgress(filing) {
  const payload = filing?.jsonPayload || {};
  const sources = payload._selectedSources || ['salary'];
  const sections = ['personalInfo', ...sources, 'deductions', 'bank'];
  const completed = sections.filter(id => isSectionComplete(id, payload)).length;
  const total = sections.length;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}
