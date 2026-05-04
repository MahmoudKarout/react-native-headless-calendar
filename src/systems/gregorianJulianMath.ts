/**
 * Shared Gregorian calendar math shared by lunar-calendar adapters (`hijri`,
 * `jalali`) that cache Y/M/D alongside a native weekday query.
 *
 * `gregorianSunday0Weekday` expects **`monthIndex` in the JavaScript
 * convention** (`0 = January` … `11 = December`).
 *
 * `gregorianJulianDay` expects **`month` calendar month numbers**
 * **`1`-based (`1 = January`)**, matching `{ year, month, day }` objects
 * returned by the converters in those modules.
 */

const _DOW_TABLE: readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
] = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];

/** Sunday = 0 … Saturday = 6 (Gregorian calendar). */
export const gregorianSunday0Weekday = (
  fullYear: number,
  /** 0-based month index (`Date#getMonth`). */
  monthIndex: number,
  dayOfMonth: number
): number => {
  const yy = monthIndex < 2 ? fullYear - 1 : fullYear;
  // `calendarSystem` callers only pass cached `Date#getMonth()` indices (0..11).
  const t =
    _DOW_TABLE[monthIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11];
  return (
    (yy +
      Math.floor(yy / 4) -
      Math.floor(yy / 100) +
      Math.floor(yy / 400) +
      t +
      dayOfMonth) %
    7
  );
};

/** Julian day number for a Gregorian calendar date (`month` 1-based). */
export const gregorianJulianDay = (
  year: number,
  /** 1-based month (`1 = January`). */
  month: number,
  day: number
): number => {
  const a = Math.floor((14 - month) / 12);
  const yr = year + 4800 - a;
  const mo = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * mo + 2) / 5) +
    365 * yr +
    Math.floor(yr / 4) -
    Math.floor(yr / 100) +
    Math.floor(yr / 400) -
    32045
  );
};
