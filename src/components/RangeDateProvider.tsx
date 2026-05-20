import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react';

import { RangeCalendarStoreContext } from '../contexts/range';
import {
  RangeCalendarStore,
  type DisabledInRangeBehavior,
  type RangeOnChange,
  type RangeOnClear,
  type RangeOnConfirm,
  type RangeSelectionPayload,
} from '../stores/RangeCalendarStore';
import {
  useSharedProviderConfig,
  type SharedProviderInputProps,
} from './providerShared';

export interface RangeDateProviderProps extends SharedProviderInputProps {
  initialStart?: unknown;
  initialEnd?: unknown;
  allowSameDay?: boolean;
  minRangeDays?: number;
  maxRangeDays?: number;
  /**
   * Policy applied when a candidate range crosses a disabled day in its
   * interior. Defaults to `'reject'` — the candidate end is refused and
   * the user must pick a different one. See `DisabledInRangeBehavior`.
   */
  disabledInRangeBehavior?: DisabledInRangeBehavior;
  onConfirm?: RangeOnConfirm;
  onClear?: RangeOnClear;
  onChange?: RangeOnChange;
  children: ReactNode;
}

export function RangeDateProvider({
  initialStart,
  initialEnd,
  allowSameDay,
  minRangeDays,
  maxRangeDays,
  disabledInRangeBehavior,
  children,
  onConfirm,
  onClear,
  onChange,
  ...sharedProps
}: RangeDateProviderProps) {
  const sharedLiveConfig = useSharedProviderConfig<RangeSelectionPayload>({
    ...sharedProps,
    onConfirm,
    onClear,
    onChange,
  });

  const liveConfig = useMemo(
    () => ({
      ...sharedLiveConfig,
      allowSameDay,
      minRangeDays,
      maxRangeDays,
      disabledInRangeBehavior,
    }),
    [
      sharedLiveConfig,
      allowSameDay,
      minRangeDays,
      maxRangeDays,
      disabledInRangeBehavior,
    ]
  );

  const [store] = useState(
    () =>
      new RangeCalendarStore({
        ...liveConfig,
        initialStart,
        initialEnd,
      })
  );

  useLayoutEffect(() => {
    store.configure(liveConfig);
  }, [store, liveConfig]);

  return (
    <RangeCalendarStoreContext.Provider value={store}>
      {children}
    </RangeCalendarStoreContext.Provider>
  );
}

RangeDateProvider.displayName = 'RangeDateProvider';
