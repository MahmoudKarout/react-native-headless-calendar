/**
 * <CalendarProvider> — the only required parent for the hooks API.
 *
 * Sole responsibilities:
 *   1. Construct the CalendarStore once (kept in a ref so it survives renders).
 *   2. Inject `firstDayOfWeek`, `modifiers`, and external callbacks via
 *      CalendarConfigContext.
 *   3. Sync prop changes into the store via a single useLayoutEffect.
 *
 * Renders no UI. The library is hooks-only: every piece of UI lives in
 * the consumer's app and is built with `useCalendarDays`,
 * `useCalendarMonths`, `useCalendarYears`, `useCalendarActions`, and
 * `useCalendarSelector`.
 */
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

import {
  CalendarConfigContext,
  CalendarStoreContext,
  type CalendarConfig,
} from '../context';
import { CalendarStore } from '../store';
import type {
  CalendarMode,
  CalendarModifiers,
  CalendarSelectionPayload,
  CalendarSystem,
  DisabledDateInput,
  DisabledDateRangeInput,
  OnClear,
  OnConfirm,
  Weekday,
} from '../types';
import { gregorianSystem } from '../systems/gregorian';
import { DEFAULT_FIRST_DAY_OF_WEEK } from '../utils/grid';
import {
  useStableArray,
  useStableCallback,
  useStablePredicate,
  useStableRecord,
} from '../utils/stableProps';

export interface CalendarRootProps {
  /**
   * One or more calendar systems. The first is used by default unless
   * `initialSystemId` is set. Defaults to `[gregorianSystem]`.
   *
   * To switch systems at runtime, swap which system is first or change
   * the provider's `key` and `initialSystemId` together.
   */
  systems?: readonly CalendarSystem[];
  /** ID of the system to start on. Defaults to `systems[0].id`. */
  initialSystemId?: string;
  /** Selection mode. */
  mode?: CalendarMode;

  /** Initial selected date in single mode. */
  initialDate?: unknown;
  /** Initial start date in range mode. */
  initialStart?: unknown;
  /** Initial end date in range mode. */
  initialEnd?: unknown;
  /** Initial selection in `'multiple'` mode (order preserved). */
  initialDates?: readonly unknown[];

  /** Inclusive lower bound for selectable dates. */
  minDate?: unknown;
  /** Inclusive upper bound for selectable dates. */
  maxDate?: unknown;

  /** Individual disabled dates. */
  disabledDates?: readonly DisabledDateInput[];
  /** Inclusive disabled date ranges. */
  disabledRanges?: readonly DisabledDateRangeInput[];
  /**
   * Optional dynamic-disabled predicate. Composes (OR) with the static
   * disable inputs and the `min/max` bounds.
   */
  disabled?: (nativeDate: Date) => boolean;

  /** Allow selecting the same day for both range endpoints. */
  allowSameDay?: boolean;
  /** Inclusive minimum confirmable range length, in days. Range mode only. */
  minRangeDays?: number;
  /** Inclusive maximum confirmable range length, in days. Range mode only. */
  maxRangeDays?: number;
  /** Inclusive cap on selected dates in `'multiple'` mode. */
  maxSelected?: number;

  /**
   * Named modifiers — each value is a list of dates / inclusive ranges, or
   * a `(nativeDate) => boolean` predicate. Surfaced per cell on
   * `DayCellInfo.modifiers` from `useCalendarDays`.
   */
  modifiers?: CalendarModifiers;

  /**
   * Which weekday occupies the first column of the day grid.
   * Defaults to `0` (Sunday). 1 = Monday (ISO 8601), 6 = Saturday, etc.
   */
  firstDayOfWeek?: Weekday;

  /** Called when `useCalendarActions().confirm()` fires. */
  onConfirm?: OnConfirm;
  /** Called when `useCalendarActions().clear()` fires. */
  onClear?: OnClear;
  /** Optional haptic hook fired on `useCalendarDays().selectDate(...)`. */
  onSelectHaptic?: () => void;

  children: ReactNode;
}

export const Root: React.FC<CalendarRootProps> = ({
  systems: systemsProp,
  initialSystemId,
  mode = 'single',
  initialDate,
  initialStart,
  initialEnd,
  initialDates,
  minDate,
  maxDate,
  disabledDates,
  disabledRanges,
  disabled,
  allowSameDay,
  minRangeDays,
  maxRangeDays,
  maxSelected,
  modifiers,
  firstDayOfWeek = DEFAULT_FIRST_DAY_OF_WEEK,
  onConfirm,
  onClear,
  onSelectHaptic,
  children,
}) => {
  const systems = systemsProp ?? [gregorianSystem];

  // Stabilise inputs that consumers commonly write inline. Without this,
  // every parent re-render would rebuild `config` and force every config
  // consumer to re-render. See ../utils/stableProps for the rationale.
  const stableSystems = useStableArray(systems);
  const stableOnConfirm: OnConfirm | undefined =
    useStableCallback<[CalendarSelectionPayload]>(onConfirm);
  const stableOnClear: OnClear | undefined = useStableCallback<[]>(onClear);
  const stableOnSelectHaptic = useStableCallback<[]>(onSelectHaptic);
  const stableDisabled = useStablePredicate<[Date], boolean>(disabled);
  const stableModifiers = useStableRecord(modifiers);

  // Store — created once, kept in a ref so identity is stable.
  const storeRef = useRef<CalendarStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new CalendarStore({
      systems: stableSystems,
      initialSystemId,
      mode,
      initialDate,
      initialStart,
      initialEnd,
      initialDates,
      minDate,
      maxDate,
      disabledDates,
      disabledRanges,
      disabled: stableDisabled,
      allowSameDay,
      minRangeDays,
      maxRangeDays,
      maxSelected,
    });
  }
  const store = storeRef.current;

  // Sync mutable props -> store. Selection inputs are intentionally not
  // re-synced — they're "initial".
  useLayoutEffect(() => {
    store.syncProps({
      systems: stableSystems,
      mode,
      minDate,
      maxDate,
      disabledDates,
      disabledRanges,
      disabled: stableDisabled,
      allowSameDay,
      minRangeDays,
      maxRangeDays,
      maxSelected,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode,
    minDate,
    maxDate,
    disabledDates,
    disabledRanges,
    stableDisabled,
    allowSameDay,
    minRangeDays,
    maxRangeDays,
    maxSelected,
  ]);

  // Swap the active system when `systems` changes identity.
  useEffect(() => {
    const currentId = store.getSnapshot().system.id;
    const idx = stableSystems.findIndex((s) => s.id === currentId);
    if (idx === -1) {
      const next = stableSystems[0];
      /* istanbul ignore else */
      if (next) store.replaceSystem(next, 0);
    } else if (stableSystems[idx] !== store.getSnapshot().system) {
      const next = stableSystems[idx];
      /* istanbul ignore else */
      if (next) store.replaceSystem(next, idx);
    }
  }, [stableSystems, store]);

  const config = useMemo<CalendarConfig>(
    () => ({
      firstDayOfWeek,
      modifiers: stableModifiers,
      onConfirm: stableOnConfirm,
      onClear: stableOnClear,
      onSelectHaptic: stableOnSelectHaptic,
    }),
    [
      firstDayOfWeek,
      stableModifiers,
      stableOnConfirm,
      stableOnClear,
      stableOnSelectHaptic,
    ]
  );

  return (
    <CalendarConfigContext.Provider value={config}>
      <CalendarStoreContext.Provider value={store}>
        {children}
      </CalendarStoreContext.Provider>
    </CalendarConfigContext.Provider>
  );
};

Root.displayName = 'CalendarProvider';
