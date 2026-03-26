/**
 * Assessment Year / Financial Year utilities
 *
 * India tax calendar:
 * - Financial Year (FY): April 1 to March 31
 * - Assessment Year (AY): The year after FY, when you file the return
 * - Example: FY 2024-25 (Apr 2024 – Mar 2025) → AY 2025-26 (file during 2025-26)
 */

/**
 * Get the current assessment year based on today's date.
 * If we're in Jan-Mar, the current AY is prevYear-currentYear (FY just ending).
 * If we're in Apr-Dec, the current AY is currentYear-nextYear (new FY started).
 */
export const getCurrentAY = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  if (month >= 4) {
    // Apr–Dec: current FY is year to year+1, so current AY = year to year+1
    return `${year}-${String(year + 1).slice(-2)}`;
  }
  // Jan–Mar: current FY is year-1 to year, so current AY = year-1 to year
  return `${year - 1}-${String(year).slice(-2)}`;
};

/**
 * Get the FY label for a given AY.
 * AY 2025-26 → FY 2024-25
 */
export const ayToFY = (ay) => {
  const [startStr] = ay.split('-');
  const start = parseInt(startStr, 10);
  return `${start - 1}-${String(start).slice(-2)}`;
};

/**
 * Get fileable assessment years — AYs the user can currently file for.
 * Rules:
 * - Current AY (most recent completed FY) — always fileable
 * - Previous AY — belated/revised return window (typically until Dec 31 of AY)
 */
export const getFileableAYs = () => {
  const currentAY = getCurrentAY();
  const [startStr] = currentAY.split('-');
  const start = parseInt(startStr, 10);

  const prevAY = `${start - 1}-${String(start).slice(-2)}`;

  return [
    { value: currentAY, label: `AY ${currentAY} (FY ${ayToFY(currentAY)})`, primary: true },
    { value: prevAY, label: `AY ${prevAY} (FY ${ayToFY(prevAY)})`, primary: false },
  ];
};
