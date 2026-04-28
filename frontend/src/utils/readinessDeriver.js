import { validateFilingCompleteness } from './filingCompletenessValidator';

const BLOCKER_SECTIONS = ['Personal Info', 'Income', 'Bank', 'General'];

export function deriveChecklist(payload, itrType) {
  try {
    const result = validateFilingCompleteness(payload, itrType);
    const items = result.missing.map(m => ({
      id: `${m.section}-${m.field}`,
      label: m.message,
      description: m.message,
      section: m.section,
      field: m.field,
      type: BLOCKER_SECTIONS.includes(m.section) ? 'blocker' : 'warning',
      status: 'pending',
    }));

    // Sort: blockers first
    items.sort((a, b) => (a.type === 'blocker' ? 0 : 1) - (b.type === 'blocker' ? 0 : 1));

    const blockers = items.filter(i => i.type === 'blocker');
    const allBlockersResolved = blockers.length === 0;
    const totalRequired = 18; // approximate total required fields
    const percentage = Math.round(((totalRequired - result.missing.length) / totalRequired) * 100);

    const summaryText = allBlockersResolved
      ? 'Ready to submit'
      : `${percentage}% ready — ${blockers[0]?.label || 'complete required fields'}`;

    return { percentage: Math.max(0, Math.min(100, percentage)), summaryText, allBlockersResolved, items };
  } catch {
    return { percentage: 0, summaryText: 'Unable to check readiness', allBlockersResolved: false, items: [] };
  }
}
