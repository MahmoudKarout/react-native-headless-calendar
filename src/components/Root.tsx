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
 * the consumer's app and is built with `useCalendarSelector` (reads,
 * usually paired with one of `selectDays / selectMonths / selectYears /
 * selectCanConfirm`) and `useCalendarActions` (writes).
 */
import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from 'react';

import { CalendarStoreContext } from '../context';
import { CalendarStore } from '../store';
import type {
  CalendarMode,
  CalendarModifiers,
  CalendarSelectionPayload,
  CalendarSystem,
  DisabledDateInput,
  DisabledDateRangeInput,
  OnChange,
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
   * `DayCellInfo.modifiers` from `useCalendarSelector(selectDays)`.
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
  /**
   * Fires whenever the selection changes — any successful `selectDate`
   * or `clear` call. Receives the full selection payload so consumers
   * can wire it straight into form state.
   */
  onChange?: OnChange;

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
  onChange,
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
  const stableOnChange: OnChange | undefined =
    useStableCallback<[CalendarSelectionPayload]>(onChange);
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
      firstDayOfWeek,
      modifiers: stableModifiers,
    });
  }
  const store = storeRef.current;

  // External callbacks are stashed on the store so action methods stay
  // referentially stable across the lifetime of the provider. Any
  // re-binding here is invisible to consumers of useCalendarActions().
  useLayoutEffect(() => {
    store.setExternalCallbacks({
      onConfirm: stableOnConfirm,
      onClear: stableOnClear,
      onChange: stableOnChange,
    });
  }, [store, stableOnConfirm, stableOnClear, stableOnChange]);

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
      firstDayOfWeek,
      modifiers: stableModifiers,
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
    firstDayOfWeek,
    stableModifiers,
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

  return (
    <CalendarStoreContext.Provider value={store}>
      {children}
    </CalendarStoreContext.Provider>
  );
};

Root.displayName = 'CalendarProvider';
