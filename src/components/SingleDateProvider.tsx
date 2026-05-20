import { useLayoutEffect, useState, type ReactNode } from 'react';

import { SingleCalendarStoreContext } from '../contexts/single';
import {
  SingleCalendarStore,
  type SingleOnChange,
  type SingleOnClear,
  type SingleOnConfirm,
  type SingleSelectionPayload,
} from '../stores/SingleCalendarStore';
import {
  useSharedProviderConfig,
  type SharedProviderInputProps,
} from './providerShared';

export interface SingleDateProviderProps extends SharedProviderInputProps {
  initialDate?: unknown;
  onConfirm?: SingleOnConfirm;
  onClear?: SingleOnClear;
  onChange?: SingleOnChange;
  children: ReactNode;
}

export function SingleDateProvider({
  initialDate,
  children,
  onConfirm,
  onClear,
  onChange,
  ...sharedProps
}: SingleDateProviderProps) {
  const liveConfig = useSharedProviderConfig<SingleSelectionPayload>({
    ...sharedProps,
    onConfirm,
    onClear,
    onChange,
  });

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
