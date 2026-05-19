/**
 * <SingleDateProvider> — provider for single-date selection.
 *
 * Mirrors the responsibilities of the legacy <CalendarProvider> but
 * accepts only the props that apply to single-date selection. Range-
 * and multiple-mode-only props (`allowSameDay`, `minRangeDays`,
 * `maxRangeDays`, `maxSelected`, `initialStart`, `initialEnd`,
 * `initialDates`) are not part of the type — TS rejects them at the
 * call site.
 *
 *   1. Construct a `SingleCalendarStore` once (kept in state).
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

import { SingleCalendarStoreContext } from '../contexts/single';
import {
  SingleCalendarStore,
  type SingleOnChange,
  type SingleOnClear,
  type SingleOnConfirm,
  type SingleSelectionPayload,
} from '../stores/SingleCalendarStore';
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

export interface SingleDateProviderProps {
  /**
   * One or more calendar systems. The first is used by default unless
   * `activeSystemId` is set. Defaults to `[gregorianSystem]`.
   */
  systems?: readonly CalendarSystem[];
  /**
   * Live id of the active calendar system. Controlled: the store keeps
   * its active system in sync with this value on every render. Omit to
   * start on `systems[0]` and switch later via
   * `useSingleCalendarActions().setActiveSystem(id)`. Unknown ids are
   * warned + ignored.
   * @default 'gregorian'
   */
  activeSystemId?: string;

  /** Initial selected date. */
  initialDate?: unknown;

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
   * `SingleDayCellInfo.modifiers`.
   */
  modifiers?: CalendarModifiers;

  /** Which weekday occupies the first column of the day grid. */
  firstDayOfWeek?: Weekday;

  /** Called when `useSingleCalendarActions().confirm()` fires. */
  onConfirm?: SingleOnConfirm;
  /** Called when `useSingleCalendarActions().clear()` fires. */
  onClear?: SingleOnClear;
  /** Fires whenever the selection changes (any successful pick / clear). */
  onChange?: SingleOnChange;

  children: ReactNode;
}

const DEFAULT_SYSTEMS = [gregorianSystem] as const;
const EMPTY_DISABLED_DATES = [] as const satisfies readonly DisabledDateInput[];
const EMPTY_DISABLED_RANGES =
  [] as const satisfies readonly DisabledDateRangeInput[];

export function SingleDateProvider({
  systems: systemsProp,
  activeSystemId,
  initialDate,
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
}: SingleDateProviderProps) {
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
    useStableCallback<[SingleSelectionPayload]>(onConfirm);
  const stableOnClear = useStableCallback<[]>(onClear);
  const stableOnChange = useStableCallback<[SingleSelectionPayload]>(onChange);
  const hasDisabledDates = disabledDates !== undefined;
  const hasDisabledRanges = disabledRanges !== undefined;

  const liveConfig = useMemo(
    () => ({
      systems: stableSystems,
      activeSystemId,
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
      activeSystemId,
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
      new SingleCalendarStore({
        ...liveConfig,
        initialDate,
      })
  );

  useLayoutEffect(() => {
    store.configure(liveConfig);
  }, [store, liveConfig]);

  return (
    <SingleCalendarStoreContext.Provider value={store}>
      {children}
    </SingleCalendarStoreContext.Provider>
  );
}

SingleDateProvider.displayName = 'SingleDateProvider';
