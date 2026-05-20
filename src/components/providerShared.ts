import { useMemo } from 'react';

import { gregorianSystem } from '../systems/gregorian';
import type {
  CalendarModifiers,
  CalendarSystem,
  DisabledDateInput,
  DisabledDateRangeInput,
  Weekday,
} from '../types';
import { DEFAULT_FIRST_DAY_OF_WEEK } from '../utils/grid';
import {
  useStableArray,
  useStableCallback,
  useStableRecord,
} from '../utils/stableProps';

export const DEFAULT_SYSTEMS = [gregorianSystem] as const;
export const EMPTY_DISABLED_DATES =
  [] as const satisfies readonly DisabledDateInput[];
export const EMPTY_DISABLED_RANGES =
  [] as const satisfies readonly DisabledDateRangeInput[];

export interface SharedProviderInputProps {
  systems?: readonly CalendarSystem[];
  activeSystemId?: string;
  minDate?: unknown;
  maxDate?: unknown;
  disabledDates?: readonly DisabledDateInput[];
  disabledRanges?: readonly DisabledDateRangeInput[];
  disabled?: (nativeDate: Date) => boolean;
  modifiers?: CalendarModifiers;
  firstDayOfWeek?: Weekday;
}

export function useSharedProviderConfig<TPayload>(props: {
  systems?: readonly CalendarSystem[];
  activeSystemId?: string;
  minDate?: unknown;
  maxDate?: unknown;
  disabledDates?: readonly DisabledDateInput[];
  disabledRanges?: readonly DisabledDateRangeInput[];
  disabled?: (nativeDate: Date) => boolean;
  modifiers?: CalendarModifiers;
  firstDayOfWeek?: Weekday;
  onConfirm?: (payload: TPayload) => void;
  onClear?: () => void;
  onChange?: (payload: TPayload) => void;
}) {
  const {
    systems: systemsProp,
    activeSystemId,
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
  } = props;

  const stableSystems = useStableArray(systemsProp ?? DEFAULT_SYSTEMS);
  const stableDisabledDates = useStableArray(
    disabledDates ?? EMPTY_DISABLED_DATES
  );
  const stableDisabledRanges = useStableArray(
    disabledRanges ?? EMPTY_DISABLED_RANGES
  );
  const stableModifiers = useStableRecord(modifiers);
  const stableDisabled = useStableCallback(disabled);
  const stableOnConfirm = useStableCallback(onConfirm);
  const stableOnClear = useStableCallback(onClear);
  const stableOnChange = useStableCallback(onChange);
  const hasDisabledDates = disabledDates !== undefined;
  const hasDisabledRanges = disabledRanges !== undefined;

  return useMemo(
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
}
