import { shallowModifiersEqual } from './BaseCalendarStore';
import type { BaseDayCellFields } from './storeTypes';

/** Shallow cell equality for the shared base fields plus optional mode flags. */
export function cellsAreEquivalent<T extends BaseDayCellFields>(
  a: T,
  b: T,
  extraEqual?: (a: T, b: T) => boolean
): boolean {
  return (
    a.label === b.label &&
    a.isCurrentMonth === b.isCurrentMonth &&
    a.isToday === b.isToday &&
    a.isDisabled === b.isDisabled &&
    a.nativeDate.getTime() === b.nativeDate.getTime() &&
    shallowModifiersEqual(a.modifiers, b.modifiers) &&
    (extraEqual ? extraEqual(a, b) : true)
  );
}
