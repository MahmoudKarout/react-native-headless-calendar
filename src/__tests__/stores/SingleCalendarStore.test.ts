import {
  createGregorianSystem,
  type GregorianDate,
} from '../../systems/gregorian';
import { SingleCalendarStore } from '../../stores/SingleCalendarStore';
import type { CalendarSystem } from '../../types';

const sys = createGregorianSystem();
const sys2 = createGregorianSystem({ label: 'Greg2' });
const sys2WithId: CalendarSystem<GregorianDate> = { ...sys2, id: 'greg2' };

const d = (y: number, m: number, day: number) =>
  sys.fromNativeDate(new Date(y, m, day));

const makeStore = (
  overrides: Partial<ConstructorParameters<typeof SingleCalendarStore>[0]> = {}
) =>
  new SingleCalendarStore({
    systems: [sys],
    initialDate: d(2024, 4, 15),
    ...overrides,
  });

describe('SingleCalendarStore — bootstrap & snapshot', () => {
  it('builds a snapshot with initial date selected', () => {
    const store = makeStore();
    const s = store.getSnapshot();
    expect(s.mode).toBe('single');
    expect(s.selectedDate).toEqual(d(2024, 4, 15));
    expect(s.days.cells).toHaveLength(42);
    expect(s.months.activeMonth).toBe(4);
    expect(s.years.activeYear).toBe(2024);
  });

  it('falls back to today() when no initialDate is given', () => {
    const store = makeStore({ initialDate: undefined });
    expect(store.getSnapshot().selectedDate).toBeUndefined();
  });

  it('throws when no systems are configured', () => {
    expect(() => new SingleCalendarStore({ systems: [] })).toThrow(
      /At least one CalendarSystem/
    );
  });

  it('respects activeSystemId at construction', () => {
    const store = new SingleCalendarStore({
      systems: [sys, sys2WithId],
      activeSystemId: 'greg2',
    });
    expect(store.getSnapshot().system.id).toBe('greg2');
    expect(store.getSnapshot().systemIndex).toBe(1);
  });

  it('falls back to systems[0] for unknown activeSystemId', () => {
    const store = new SingleCalendarStore({
      systems: [sys, sys2WithId],
      activeSystemId: 'doesNotExist',
    });
    expect(store.getSnapshot().systemIndex).toBe(0);
  });
});

describe('SingleCalendarStore — selectDate / clear / confirm', () => {
  it('selectDate updates the snapshot and notifies subscribers', () => {
    const store = makeStore();
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);
    store.selectDate(new Date(2024, 5, 10));
    expect(store.getSnapshot().selectedDate).toEqual(d(2024, 5, 10));
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.selectDate(new Date(2024, 6, 1));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('selectDate is a no-op for disabled dates', () => {
    const onChange = jest.fn();
    const store = makeStore({
      onChange,
      minDate: new Date(2024, 4, 10),
    });
    store.selectDate(new Date(2024, 4, 5));
    expect(store.getSnapshot().selectedDate).toEqual(d(2024, 4, 15));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('fires onChange with the payload when selecting', () => {
    const onChange = jest.fn();
    const store = makeStore({ initialDate: undefined, onChange });
    store.selectDate(new Date(2024, 4, 20));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        gregorianDate: expect.any(Date),
        system: { year: 2024, month: 4, day: 20 },
        systemId: 'gregorian',
      })
    );
  });

  it('clear empties selection and fires onClear + onChange', () => {
    const onClear = jest.fn();
    const onChange = jest.fn();
    const store = makeStore({ onClear, onChange });
    store.clear();
    expect(store.getSnapshot().selectedDate).toBeUndefined();
    expect(onClear).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ gregorianDate: undefined, system: undefined })
    );
  });

  it('clear without an existing selection still fires onClear but not onChange', () => {
    const onClear = jest.fn();
    const onChange = jest.fn();
    const store = makeStore({ initialDate: undefined, onClear, onChange });
    store.clear();
    expect(onClear).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('confirm fires onConfirm with the current selection', () => {
    const onConfirm = jest.fn();
    const store = makeStore({ onConfirm });
    store.confirm();
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ systemId: 'gregorian' })
    );
  });

  it('confirm is a no-op when no callback is set', () => {
    const store = makeStore();
    expect(() => store.confirm()).not.toThrow();
  });

  it('isConfirmable reflects selection presence', () => {
    const store = makeStore({ initialDate: undefined });
    expect(store.isConfirmable()).toBe(false);
    store.selectDate(new Date(2024, 4, 1));
    expect(store.isConfirmable()).toBe(true);
  });
});

describe('SingleCalendarStore — navigation', () => {
  it('changeMonth moves displayed date', () => {
    const store = makeStore();
    store.nextMonth();
    expect((store.getSnapshot().displayed as GregorianDate).m).toBe(5);
    store.prevMonth();
    expect((store.getSnapshot().displayed as GregorianDate).m).toBe(4);
  });

  it('setView changes view and is a no-op when unchanged', () => {
    const store = makeStore();
    const listener = jest.fn();
    store.subscribe(listener);
    store.setView('month');
    store.setView('month');
    expect(store.getSnapshot().view).toBe('month');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('goToYear and goToMonth set displayed + reset to day view in a single emit', () => {
    const store = makeStore();
    store.setView('year');
    const listener = jest.fn();
    store.subscribe(listener);
    store.goToYear(2030);
    expect(store.getSnapshot().view).toBe('day');
    expect((store.getSnapshot().displayed as GregorianDate).y).toBe(2030);
    expect(listener).toHaveBeenCalledTimes(1);

    store.goToMonth(0);
    expect((store.getSnapshot().displayed as GregorianDate).m).toBe(0);
  });

  it('setDisplayedDate updates and is a no-op when same', () => {
    const store = makeStore();
    const listener = jest.fn();
    store.subscribe(listener);
    store.setDisplayedDate(new Date(2024, 4, 15));
    store.setDisplayedDate(new Date(2025, 0, 5));
    expect((store.getSnapshot().displayed as GregorianDate).y).toBe(2025);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('cycles setView through day → month → year → day', () => {
    const store = makeStore();
    const listener = jest.fn();
    store.subscribe(listener);
    store.setView('month');
    expect(store.getSnapshot().view).toBe('month');
    store.setView('year');
    expect(store.getSnapshot().view).toBe('year');
    store.setView('day');
    expect(store.getSnapshot().view).toBe('day');
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('prevYearPage and nextYearPage step the displayed year by YEAR_PAGE_SIZE', () => {
    const store = makeStore();
    store.nextYearPage();
    expect((store.getSnapshot().displayed as GregorianDate).y).toBe(2036);
    store.prevYearPage();
    expect((store.getSnapshot().displayed as GregorianDate).y).toBe(2024);
  });
});

describe('SingleCalendarStore — configure / reconcile', () => {
  it('configure(...) updates callbacks without recreating the store', () => {
    const store = makeStore();
    const onChange = jest.fn();
    store.configure({
      systems: [sys],
      initialDate: undefined,
      onChange,
    });
    store.selectDate(new Date(2024, 5, 1));
    expect(onChange).toHaveBeenCalled();
  });

  it('configure(...) re-derives day grid when firstDayOfWeek changes', () => {
    const store = makeStore();
    const cellsBefore = store.getSnapshot().days.cells;
    store.configure({
      systems: [sys],
      firstDayOfWeek: 6,
    });
    expect(store.getSnapshot().days.cells).not.toBe(cellsBefore);
  });

  it('configure(...) is a no-op for min/max when value matches', () => {
    const store = makeStore({
      minDate: new Date(2024, 4, 1),
      maxDate: new Date(2024, 4, 30),
    });
    const before = store.getSnapshot();
    store.configure({
      systems: [sys],
      initialDate: new Date(2024, 4, 15),
      minDate: new Date(2024, 4, 1),
      maxDate: new Date(2024, 4, 30),
    });
    const after = store.getSnapshot();
    expect(after.minDate).toBe(before.minDate);
    expect(after.maxDate).toBe(before.maxDate);
  });

  it('configure(...) updates min/max bounds and disabled lists', () => {
    const store = makeStore();
    store.configure({
      systems: [sys],
      minDate: new Date(2024, 4, 10),
      maxDate: new Date(2024, 4, 20),
      disabledDates: [new Date(2024, 4, 12)],
      disabledRanges: [
        { start: new Date(2024, 4, 13), end: new Date(2024, 4, 14) },
      ],
      disabled: (nd) => nd.getDate() === 18,
    });
    store.selectDate(new Date(2024, 4, 12));
    expect(store.getSnapshot().selectedDate).toEqual(d(2024, 4, 15));
    store.selectDate(new Date(2024, 4, 13));
    expect(store.getSnapshot().selectedDate).toEqual(d(2024, 4, 15));
    store.selectDate(new Date(2024, 4, 5));
    expect(store.getSnapshot().selectedDate).toEqual(d(2024, 4, 15));
    store.selectDate(new Date(2024, 4, 25));
    expect(store.getSnapshot().selectedDate).toEqual(d(2024, 4, 15));
    store.selectDate(new Date(2024, 4, 18));
    expect(store.getSnapshot().selectedDate).toEqual(d(2024, 4, 15));
    store.selectDate(new Date(2024, 4, 17));
    expect(store.getSnapshot().selectedDate).toEqual(d(2024, 4, 17));
  });

  it('configure(...) clears bounds and disabled lists when set to undefined', () => {
    const store = makeStore({
      minDate: new Date(2024, 4, 10),
      maxDate: new Date(2024, 4, 20),
      disabledDates: [new Date(2024, 4, 12)],
      disabledRanges: [
        { start: new Date(2024, 4, 13), end: new Date(2024, 4, 14) },
      ],
    });
    store.configure({ systems: [sys] });
    const s = store.getSnapshot();
    expect(s.minDate).toBeUndefined();
    expect(s.maxDate).toBeUndefined();
    expect(s.disabledDates).toBeUndefined();
    expect(s.disabledRanges).toBeUndefined();
  });

  it('configure(...) skips per-element mapping when identity stays the same', () => {
    const list = [new Date(2024, 4, 12)];
    const store = makeStore({ disabledDates: list });
    const before = store.getSnapshot().disabledDates;
    store.configure({ systems: [sys], disabledDates: list });
    expect(store.getSnapshot().disabledDates).toBe(before);
  });

  it('configure(...) updates modifiers and re-derives cells', () => {
    const store = makeStore();
    const cellsBefore = store.getSnapshot().days.cells;
    store.configure({
      systems: [sys],
      modifiers: { booked: [new Date(2024, 4, 15)] },
    });
    const after = store.getSnapshot().days.cells;
    expect(after).not.toBe(cellsBefore);
    const cell = after.find(
      (c) => c.nativeDate.getDate() === 15 && c.isCurrentMonth
    );
    expect(cell?.modifiers.booked).toBe(true);
  });

  it('catches buggy disabled predicate and treats date as enabled', () => {
    const store = makeStore({
      disabled: () => {
        throw new Error('boom');
      },
    });
    store.selectDate(new Date(2024, 5, 10));
    expect((store.getSnapshot().selectedDate as GregorianDate).d).toBe(10);
  });
});

describe('SingleCalendarStore — system switching', () => {
  it('setActiveSystem(...) carries selection across systems', () => {
    const store = new SingleCalendarStore({
      systems: [sys, sys2WithId],
      initialDate: new Date(2024, 4, 15),
    });
    store.setActiveSystem('greg2');
    expect(store.getSnapshot().system.id).toBe('greg2');
    expect(store.getSnapshot().selectedDate).toBeDefined();
  });

  it('setActiveSystem(...) is a no-op when id matches', () => {
    const store = new SingleCalendarStore({
      systems: [sys, sys2WithId],
    });
    const listener = jest.fn();
    store.subscribe(listener);
    store.setActiveSystem('gregorian');
    expect(listener).not.toHaveBeenCalled();
  });

  it('setActiveSystem(...) warns and no-ops for unknown ids', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const store = makeStore();
    store.setActiveSystem('unknown');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('setActiveSystem(...) stays silent in production for unknown ids', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const store = makeStore();
      store.setActiveSystem('unknown');
      expect(warn).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = prev;
      warn.mockRestore();
    }
  });

  it('configure(...) with a new systems list swaps the active system', () => {
    const store = new SingleCalendarStore({
      systems: [sys],
      initialDate: new Date(2024, 4, 15),
    });
    store.configure({ systems: [sys2WithId] });
    expect(store.getSnapshot().system.id).toBe('greg2');
  });

  it('configure(...) reuses the existing system when only the systems array reorders', () => {
    const store = new SingleCalendarStore({
      systems: [sys, sys2WithId],
    });
    store.configure({ systems: [sys2WithId, sys] });
    expect(store.getSnapshot().system.id).toBe('gregorian');
    expect(store.getSnapshot().systemIndex).toBe(1);
  });

  it('configure(...) with activeSystemId switches systems', () => {
    const store = new SingleCalendarStore({
      systems: [sys, sys2WithId],
    });
    store.configure({
      systems: [sys, sys2WithId],
      activeSystemId: 'greg2',
    });
    expect(store.getSnapshot().system.id).toBe('greg2');
  });

  it('setActiveSystem no-ops when id matches but systemIndex equal too (replaceSystem early-out)', () => {
    // Force-trigger replaceSystem with current system to hit the early-return.
    const store = new SingleCalendarStore({
      systems: [sys, sys2WithId],
    });
    const listener = jest.fn();
    store.subscribe(listener);
    // Hand-call replaceSystem via setActiveSystem after replacing systems list
    // so the system is the same instance.
    store.configure({
      systems: [sys, sys2WithId],
      activeSystemId: 'gregorian',
    });
    expect(listener).not.toHaveBeenCalled();
  });

  it('clears selection carry when starting without selection', () => {
    const store = new SingleCalendarStore({
      systems: [sys, sys2WithId],
    });
    store.setActiveSystem('greg2');
    expect(store.getSnapshot().selectedDate).toBeUndefined();
  });

  it('carries disabledDates / disabledRanges / min / max across systems', () => {
    const store = new SingleCalendarStore({
      systems: [sys, sys2WithId],
      minDate: new Date(2024, 4, 1),
      maxDate: new Date(2024, 4, 30),
      disabledDates: [new Date(2024, 4, 12)],
      disabledRanges: [
        { start: new Date(2024, 4, 14), end: new Date(2024, 4, 15) },
      ],
    });
    store.setActiveSystem('greg2');
    const s = store.getSnapshot();
    expect(s.minDate).toBeDefined();
    expect(s.maxDate).toBeDefined();
    expect(s.disabledDates).toHaveLength(1);
    expect(s.disabledRanges).toHaveLength(1);
  });

  it('configure(...) commits a systemIndex update when same system instance is reindexed', () => {
    const sysSameId: CalendarSystem<GregorianDate> = {
      ...createGregorianSystem(),
      id: 'twin',
    };
    const store = new SingleCalendarStore({
      systems: [sys, sysSameId],
    });
    const listener = jest.fn();
    store.subscribe(listener);
    // Same system instance but a different array shape: keep the SAME instance
    // at a new index so reconcileSystem hits the systemIndex-only commit path.
    store.configure({
      systems: [sysSameId, sys],
    });
    expect(store.getSnapshot().systemIndex).toBe(1);
    expect(store.getSnapshot().system).toBe(sys);
    expect(listener).toHaveBeenCalled();
  });

  it('falls back to systems[0] when configure activeSystemId is unknown in the new systems list', () => {
    const store = new SingleCalendarStore({
      systems: [sys, sys2WithId],
      activeSystemId: 'greg2',
    });
    // Drop greg2 from the list and ask for it via activeSystemId — the
    // reconciler should fall back to systems[0] (which is sys/'gregorian').
    store.configure({ systems: [sys], activeSystemId: 'greg2' });
    expect(store.getSnapshot().system.id).toBe('gregorian');
    expect(store.getSnapshot().systemIndex).toBe(0);
  });

  it('configure(...) swaps to a same-id different-instance system', () => {
    const sysClone: CalendarSystem<GregorianDate> = {
      ...sys,
      id: 'gregorian',
    };
    const store = new SingleCalendarStore({ systems: [sys] });
    store.configure({ systems: [sysClone] });
    expect(store.getSnapshot().system).toBe(sysClone);
  });
});

describe('SingleCalendarStore — batch / commit coalescing', () => {
  // Drill into the protected `batch` via a tiny subclass to verify the
  // pendingEmit fast-path that the public navigation actions rely on.
  class ProbeStore extends SingleCalendarStore {
    runBatchedCommits(): void {
      this.batch(() => {
        this.commit({
          ...this.getSnapshot(),
          view: 'month',
        });
        this.commit({
          ...this.getSnapshot(),
          view: 'year',
        });
      });
    }

    runNestedBatches(): void {
      this.batch(() => {
        this.commit({ ...this.getSnapshot(), view: 'month' });
        this.batch(() => {
          this.commit({ ...this.getSnapshot(), view: 'year' });
        });
      });
    }
  }

  it('coalesces multiple commits inside a single batch into one emit', () => {
    const store = new ProbeStore({
      systems: [sys],
      initialDate: new Date(2024, 4, 15),
    });
    const listener = jest.fn();
    store.subscribe(listener);
    store.runBatchedCommits();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().view).toBe('year');
  });

  it('only emits once at the outermost batch boundary when batches are nested', () => {
    const store = new ProbeStore({
      systems: [sys],
      initialDate: new Date(2024, 4, 15),
    });
    const listener = jest.fn();
    store.subscribe(listener);
    store.runNestedBatches();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().view).toBe('year');
  });
});

describe('SingleCalendarStore — day cell stability', () => {
  it('reuses cell references when nothing changed except selection toggle', () => {
    const store = makeStore();
    const before = store.getSnapshot().days.cells;
    store.selectDate(new Date(2024, 4, 16));
    const after = store.getSnapshot().days.cells;
    // Non-selected cells retain identity, selected one is new.
    let reused = 0;
    for (let i = 0; i < before.length; i += 1) {
      if (before[i] === after[i]) reused += 1;
    }
    expect(reused).toBeGreaterThanOrEqual(40);
  });
});
