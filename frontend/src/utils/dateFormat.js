/**
 * Format a date string to DD/MM/YYYY for display.
 * Accepts ISO (2026-03-28), Date objects, or any parseable date string.
 * Returns empty string for null/undefined/invalid.
 */
export function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
