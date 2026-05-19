/**
 * <MultipleDateProvider> — provider for multi-day selection.
 *
 * Mirrors the responsibilities of the legacy <CalendarProvider> but
 * accepts only the props that apply to a multi-pick. Single- and
 * range-mode-only props (`initialDate`, `initialStart`, `initialEnd`,
 * `allowSameDay`, `minRangeDays`, `maxRangeDays`) are not part of the
 * type — TS rejects them at the call site.
 *
 *   1. Construct a `MultipleCalendarStore` once (kept in state).
 *   2. Stabilise inline-prone props.
 *   3. Bootstrap the store synchronously via its constructor so child
 *      selectors can read a populated snapshot on the first render.
 *   4. Forward live props to `store.configure(...)` from a single
 *      `useLayoutEffect`. The store handles reconciliation,
 *      active-system validation, and single-emit coalescing.
 *
 * Renders no UI — the library is hooks-only.
 */
import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react';

import { MultipleCalendarStoreContext } from '../contexts/multiple';
import {
  MultipleCalendarStore,
  type MultipleOnChange,
  type MultipleOnClear,
  type MultipleOnConfirm,
  type MultipleSelectionPayload,
} from '../stores/MultipleCalendarStore';
import type {
  CalendarModifiers,
  CalendarSystem,
  DisabledDateInput,
  DisabledDateRangeInput,
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

export interface MultipleDateProviderProps {
  /**
   * One or more calendar systems. The first is used by default unless
   * `initialSystemId` is set. Defaults to `[gregorianSystem]`.
   */
  systems?: readonly CalendarSystem[];
  /** ID of the system to start on. Defaults to `systems[0].id`. */
  initialSystemId?: string;

  /** Initial selection set (order preserved). */
  initialDates?: readonly unknown[];

  /** Inclusive cap on the number of dates that can be selected. */
  maxSelected?: number;

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

  /**
   * Named modifiers — each value is a list of dates / inclusive ranges,
   * or a `(nativeDate) => boolean` predicate. Surfaced per cell on
   * `MultipleDayCellInfo.modifiers`.
   */
  modifiers?: CalendarModifiers;

  /** Which weekday occupies the first column of the day grid. */
  firstDayOfWeek?: Weekday;

  /** Called when `useMultipleCalendarActions().confirm()` fires. */
  onConfirm?: MultipleOnConfirm;
  /** Called when `useMultipleCalendarActions().clear()` fires. */
  onClear?: MultipleOnClear;
  /** Fires whenever the selection changes (any toggle / clear). */
  onChange?: MultipleOnChange;

  children: ReactNode;
}

const DEFAULT_SYSTEMS = [gregorianSystem] as const;
const EMPTY_DISABLED_DATES = [] as const satisfies readonly DisabledDateInput[];
const EMPTY_DISABLED_RANGES =
  [] as const satisfies readonly DisabledDateRangeInput[];

export function MultipleDateProvider({
  systems: systemsProp,
  initialSystemId,
  initialDates,
  maxSelected,
  minDate,
  maxDate,
  disabledDates,
  disabledRanges,
  disabled,
  modifiers,
  firstDayOfWeek = DEFAULT_FIRST_DAY_OF_WEEK,
  onConfirm,
  onClear,
  onChange,
  children,
}: MultipleDateProviderProps) {
  const stableSystems = useStableArray(systemsProp ?? DEFAULT_SYSTEMS);
  const stableDisabledDates = useStableArray(
    disabledDates ?? EMPTY_DISABLED_DATES
  );
  const stableDisabledRanges = useStableArray(
    disabledRanges ?? EMPTY_DISABLED_RANGES
  );
  const stableModifiers = useStableRecord(modifiers);
  const stableDisabled = useStablePredicate<[Date], boolean>(disabled);

  const stableOnConfirm =
    useStableCallback<[MultipleSelectionPayload]>(onConfirm);
  const stableOnClear = useStableCallback<[]>(onClear);
  const stableOnChange =
    useStableCallback<[MultipleSelectionPayload]>(onChange);
  const hasDisabledDates = disabledDates !== undefined;
  const hasDisabledRanges = disabledRanges !== undefined;

  const liveConfig = useMemo(
    () => ({
      systems: stableSystems,
      maxSelected,
      minDate,
      maxDate,
      disabledDates: hasDisabledDates ? stableDisabledDates : undefined,
      disabledRanges: hasDisabledRanges ? stableDisabledRanges : undefined,
      disabled: stableDisabled,
      firstDayOfWeek,
      modifiers: stableModifiers,
      onConfirm: stableOnConfirm,
      onClear: stableOnClear,
      onChange: stableOnChange,
    }),
    [
      stableSystems,
      maxSelected,
      minDate,
      maxDate,
      hasDisabledDates,
      hasDisabledRanges,
      stableDisabledDates,
      stableDisabledRanges,
      stableDisabled,
      firstDayOfWeek,
      stableModifiers,
      stableOnConfirm,
      stableOnClear,
      stableOnChange,
    ]
  );

  const [store] = useState(
    () =>
      new MultipleCalendarStore({
        ...liveConfig,
        initialSystemId,
        initialDates,
      })
  );

  useLayoutEffect(() => {
    store.configure(liveConfig);
  }, [store, liveConfig]);

  return (
    <MultipleCalendarStoreContext.Provider value={store}>
      {children}
    </MultipleCalendarStoreContext.Provider>
  );
}

MultipleDateProvider.displayName = 'MultipleDateProvider';
