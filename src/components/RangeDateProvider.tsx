import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react';

import { RangeCalendarStoreContext } from '../contexts/range';
import {
  RangeCalendarStore,
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
    }),
    [sharedLiveConfig, allowSameDay, minRangeDays, maxRangeDays]
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
