import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react';

import { MultipleCalendarStoreContext } from '../contexts/multiple';
import {
  MultipleCalendarStore,
  type MultipleOnChange,
  type MultipleOnClear,
  type MultipleOnConfirm,
  type MultipleSelectionPayload,
} from '../stores/MultipleCalendarStore';
import {
  useSharedProviderConfig,
  type SharedProviderInputProps,
} from './providerShared';

export interface MultipleDateProviderProps extends SharedProviderInputProps {
  initialDates?: readonly unknown[];
  maxSelected?: number;
  onConfirm?: MultipleOnConfirm;
  onClear?: MultipleOnClear;
  onChange?: MultipleOnChange;
  children: ReactNode;
}

export function MultipleDateProvider({
  initialDates,
  maxSelected,
  children,
  onConfirm,
  onClear,
  onChange,
  ...sharedProps
}: MultipleDateProviderProps) {
  const sharedLiveConfig = useSharedProviderConfig<MultipleSelectionPayload>({
    ...sharedProps,
    onConfirm,
    onClear,
    onChange,
  });

  const liveConfig = useMemo(
    () => ({
      ...sharedLiveConfig,
      maxSelected,
    }),
    [sharedLiveConfig, maxSelected]
  );

  const [store] = useState(
    () =>
      new MultipleCalendarStore({
        ...liveConfig,
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
