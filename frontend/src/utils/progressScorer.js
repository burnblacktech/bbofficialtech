import { validateFilingCompleteness } from './filingCompletenessValidator';

const SECTION_WEIGHTS = {
  'Personal Info': 14, 'Income': 1, 'Bank': 3, 'Salary': 2, 'Other Income': 2,
  'House Property': 1, 'Capital Gains': 1, 'Business': 1, 'Deductions': 1, 'Taxes Paid': 1,
};

export function computeProgress(payload, itrType) {
  try {
    const result = validateFilingCompleteness(payload, itrType);
    const totalRequired = 14 + 1 + 3; // personal info + income + bank (minimum)
    const missingCount = result.missing.length;
    const resolvedCount = Math.max(0, totalRequired - missingCount);
    const percentage = Math.round((resolvedCount / totalRequired) * 100);
    const color = percentage <= 30 ? 'red' : percentage <= 70 ? 'amber' : 'green';

    // Group missing by section
    const sectionStatus = {};
    for (const item of result.missing) {
      if (!sectionStatus[item.section]) sectionStatus[item.section] = { missing: 0 };
      sectionStatus[item.section].missing++;
    }

    const sections = Object.entries(SECTION_WEIGHTS).map(([label, weight]) => ({
      id: label.toLowerCase().replace(/\s+/g, '_'),
      label,
      status: !sectionStatus[label] ? 'complete' : sectionStatus[label].missing > 0 ? 'partial' : 'complete',
      weight,
    }));

    const nextIncomplete = sections.find(s => s.status !== 'complete')?.id || null;
    return { percentage, color, sections, nextIncomplete };
  } catch {
    return { percentage: 0, color: 'red', sections: [], nextIncomplete: null };
  }
}
