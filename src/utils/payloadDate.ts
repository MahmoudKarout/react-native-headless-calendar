/**
 * Build the `Date` returned in selection payloads.
 *
 * `system.toNativeDate` returns a `Date` at local midnight (e.g. `new Date(y, m, d)`).
 * That's convenient for internal calculations, but when consumers serialize the
 * payload date (e.g. `JSON.stringify` → `toISOString`) it gets shifted by the
 * user's timezone offset and the resulting ISO string no longer matches the
 * calendar day the user selected. For example, selecting May 12 in UTC+3
 * produces `2026-05-11T21:00:00.000Z`.
 *
 * To make the payload `Date` round-trip cleanly through ISO strings, we anchor
 * it at UTC midnight of the same Gregorian calendar day instead.
 */
import type { CalendarSystem } from '../types';

export function toPayloadDate<T>(system: CalendarSystem<T>, d: T): Date {
  const local = system.toNativeDate(d);
  return new Date(
    Date.UTC(local.getFullYear(), local.getMonth(), local.getDate())
  );
}
