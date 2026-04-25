/**
 * greetingCopy — Time-of-day greeting variants and filing season subtitles.
 *
 * Used by the Financial Command Center dashboard greeting section.
 */

const GREETING_VARIANTS = {
  morning: 'Good morning, {firstName}',
  afternoon: 'Good afternoon, {firstName}',
  evening: 'Good evening, {firstName}',
  night: 'Hey there, {firstName}',

  // Filing season proximity subtitles
  deadlineNear: "Let's get your {ay} return wrapped up.",
  deadlineApproaching: 'Filing season is here — you\'re in good shape.',
  offSeason: 'Keep tracking — filing season will be a breeze.',
  postDeadline: 'Belated filing is still open. Let\'s get it done.',

  // First-time user
  firstVisit: 'Welcome to BurnBlack, {firstName}! Let\'s set things up.',
};

/**
 * Get the time-of-day greeting key.
 * @param {number} [hour] - Hour (0-23). Defaults to current hour.
 * @returns {'morning'|'afternoon'|'evening'|'night'}
 */
export function getTimeOfDayKey(hour) {
  const h = hour ?? new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

/**
 * Get the filing season subtitle key.
 * @param {number|null} daysToDeadline - Days remaining to filing deadline. Null if unknown.
 * @returns {'deadlineNear'|'deadlineApproaching'|'offSeason'|'postDeadline'}
 */
export function getSeasonKey(daysToDeadline) {
  if (daysToDeadline === null || daysToDeadline === undefined) return 'offSeason';
  if (daysToDeadline < 0) return 'postDeadline';
  if (daysToDeadline <= 30) return 'deadlineNear';
  if (daysToDeadline <= 120) return 'deadlineApproaching';
  return 'offSeason';
}

/**
 * Interpolate template variables in a greeting string.
 * @param {string} template - Template with {variable} placeholders
 * @param {Record<string, string>} vars - Variable values
 * @returns {string}
 */
function interpolate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || '');
}

/**
 * Build the full greeting for the dashboard.
 * @param {object} params
 * @param {string} params.firstName - User's first name
 * @param {string} [params.ay] - Assessment year (e.g., "2025-26")
 * @param {number|null} [params.daysToDeadline] - Days to filing deadline
 * @param {boolean} [params.isFirstVisit] - Whether user has no data
 * @param {number} [params.hour] - Override hour for testing
 * @returns {{ greeting: string, subtitle: string }}
 */
export function getGreeting({ firstName, ay = '', daysToDeadline = null, isFirstVisit = false, hour }) {
  const vars = { firstName, ay };

  if (isFirstVisit) {
    return {
      greeting: interpolate(GREETING_VARIANTS.firstVisit, vars),
      subtitle: '',
    };
  }

  const timeKey = getTimeOfDayKey(hour);
  const seasonKey = getSeasonKey(daysToDeadline);

  return {
    greeting: interpolate(GREETING_VARIANTS[timeKey], vars),
    subtitle: interpolate(GREETING_VARIANTS[seasonKey], vars),
  };
}

export { GREETING_VARIANTS };
export default getGreeting;
