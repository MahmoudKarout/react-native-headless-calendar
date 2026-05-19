import {
  createContext,
  use,
  useMemo,
  useSyncExternalStore,
  type Context,
} from 'react';

type SubscribableStore<S> = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => S;
};

export interface CalendarContextBundle<
  Store extends SubscribableStore<Snapshot>,
  Snapshot,
  Actions,
> {
  StoreContext: Context<Store | null>;
  useStore: () => Store;
  useCalendarSelector: <T>(selector: (snapshot: Snapshot) => T) => T;
  useCalendarActions: () => Actions;
}

export function createCalendarContext<
  Store extends SubscribableStore<Snapshot>,
  Snapshot,
  Actions,
>(config: {
  modeLabel: string;
  providerName: string;
  mapActions: (store: Store) => Actions;
}): CalendarContextBundle<Store, Snapshot, Actions> {
  const StoreContext = createContext<Store | null>(null);

  function useStore(): Store {
    const store = use(StoreContext);
    if (!store) {
      throw new Error(
        `[Calendar] ${config.modeLabel} hooks must be used within <${config.providerName}>`
      );
    }
    return store;
  }

  function useCalendarSelector<T>(
    selector: (snapshot: Snapshot) => T
  ): T {
    const store = useStore();
    return useSyncExternalStore(store.subscribe, () =>
      selector(store.getSnapshot())
    );
  }

  function useCalendarActions(): Actions {
    const store = useStore();
    return useMemo(() => config.mapActions(store), [store]);
  }

  return {
    StoreContext,
    useStore,
    useCalendarSelector,
    useCalendarActions,
  };
}

/** Navigation + system mutators shared by every selection mode. */
export function mapSharedStoreActions<
  Store extends {
    selectDate: (input: unknown) => void;
    clear: () => void;
    confirm: () => void;
    prevMonth: () => void;
    nextMonth: () => void;
    setDisplayedDate: (input: unknown) => void;
    goToMonth: (index: number) => void;
    goToYear: (year: number) => void;
    prevYearPage: () => void;
    nextYearPage: () => void;
    setActiveSystem: (id: string) => void;
    isConfirmable: () => boolean;
  },
>(store: Store) {
  return {
    selectDate: store.selectDate,
    clear: store.clear,
    confirm: store.confirm,
    goPrevMonth: store.prevMonth,
    goNextMonth: store.nextMonth,
    setDisplayedDate: store.setDisplayedDate,
    selectMonth: store.goToMonth,
    selectYear: store.goToYear,
    prevYearPage: store.prevYearPage,
    nextYearPage: store.nextYearPage,
    setActiveSystem: store.setActiveSystem,
    isConfirmable: store.isConfirmable,
  };
}
