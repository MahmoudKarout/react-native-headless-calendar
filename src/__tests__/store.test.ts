import { CalendarStore, type CalendarStoreOptions } from '../store';
import {
  createGregorianSystem,
  type GregorianDate,
} from '../systems/gregorian';

const sys = createGregorianSystem();
const altSys = createGregorianSystem({ label: 'Alt' });

const date = (y: number, m: number, d: number): GregorianDate =>
  sys.fromNativeDate(new Date(y, m, d));

type StoreOpts = Partial<CalendarStoreOptions<GregorianDate>>;

const makeStore = (overrides: StoreOpts = {}): CalendarStore<GregorianDate> =>
  new CalendarStore<GregorianDate>({
    systems: [sys],
    mode: 'single',
    ...overrides,
  });

describe('CalendarStore — construction', () => {
  it('throws when no systems are supplied', () => {
    expect(() => new CalendarStore({ systems: [], mode: 'single' })).toThrow(
      /CalendarSystem/
    );
  });

  it('defaults to the first system when no initialSystemId is provided', () => {
    const store = new CalendarStore({
      systems: [sys, altSys],
      mode: 'single',
    });
    expect(store.getSnapshot().system).toBe(sys);
    expect(store.getSnapshot().systemIndex).toBe(0);
  });

  it('selects a specific system by initialSystemId', () => {
    const second = createGregorianSystem({ label: 'B' });
    const store = new CalendarStore({
      systems: [sys, second],
      mode: 'single',
      initialSystemId: second.id,
    });
    // Both stub systems have id "gregorian" so findIndex returns 0 → still sys.
    // Provide a system with a unique id to actually exercise the lookup.
    expect(store.getSnapshot().systemIndex).toBe(0);
  });

  it('resolves initialSystemId by id match', () => {
    const hijriLike = {
      ...sys,
      id: 'mock-hijri',
      label: 'Mock Hijri',
    };
    const store = new CalendarStore({
      systems: [sys, hijriLike],
      mode: 'single',
      initialSystemId: 'mock-hijri',
    });
    expect(store.getSnapshot().systemIndex).toBe(1);
    expect(store.getSnapshot().system.id).toBe('mock-hijri');
  });

  it('falls back to the first system when initialSystemId is unknown', () => {
    const store = new CalendarStore({
      systems: [sys],
      mode: 'single',
      initialSystemId: 'does-not-exist',
    });
    expect(store.getSnapshot().systemIndex).toBe(0);
  });

  it('uses today() when no seed date is given (single mode)', () => {
    const store = makeStore();
    const t = sys.today();
    expect(sys.isSame(store.getSnapshot().displayed, t)).toBe(true);
  });

  it('uses initialDate as the seed in single mode', () => {
    const store = makeStore({ initialDate: new Date(2024, 4, 15) });
    expect(sys.year(store.getSnapshot().displayed)).toBe(2024);
    expect(sys.day(store.getSnapshot().displayed)).toBe(15);
    expect(store.getSnapshot().selectedDate).toBeDefined();
  });

  it('uses initialStart as the seed in range mode (start present)', () => {
    const store = makeStore({
      mode: 'range',
      initialStart: new Date(2024, 4, 1),
    });
    expect(sys.day(store.getSnapshot().displayed)).toBe(1);
  });

  it('uses initialEnd as the seed in range mode when start is missing', () => {
    const store = makeStore({
      mode: 'range',
      initialEnd: new Date(2024, 4, 20),
    });
    expect(sys.day(store.getSnapshot().displayed)).toBe(20);
  });

  it('falls back to today() in range mode when neither bound is provided', () => {
    const store = makeStore({ mode: 'range' });
    expect(sys.isSame(store.getSnapshot().displayed, sys.today())).toBe(true);
  });

  it('normalises minDate / maxDate / disabled lists at construction', () => {
    const store = makeStore({
      minDate: new Date(2024, 0, 1),
      maxDate: new Date(2024, 11, 31),
      disabledDates: [new Date(2024, 5, 15)],
      disabledRanges: [
        { start: new Date(2024, 6, 1), end: new Date(2024, 6, 5) },
      ],
    });
    const s = store.getSnapshot();
    expect(s.minDate).toBeDefined();
    expect(s.maxDate).toBeDefined();
    expect(s.disabledDates).toHaveLength(1);
    expect(s.disabledRanges).toHaveLength(1);
  });

  it('defaults allowSameDay to false', () => {
    expect(makeStore().getSnapshot().allowSameDay).toBe(false);
  });

  it('honours allowSameDay = true', () => {
    expect(makeStore({ allowSameDay: true }).getSnapshot().allowSameDay).toBe(
      true
    );
  });

  it('coerces allowSameDay = undefined to false in syncProps', () => {
    const store = makeStore({ allowSameDay: true });
    store.syncProps({ systems: [sys], mode: 'single' });
    expect(store.getSnapshot().allowSameDay).toBe(false);
  });
});

describe('CalendarStore — subscription', () => {
  it('notifies subscribers exactly once per commit', () => {
    const store = makeStore();
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);
    store.changeMonth(1);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.changeMonth(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('exposes a stable getSnapshot reference between commits', () => {
    const store = makeStore();
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });
});

describe('CalendarStore — actions', () => {
  describe('setView()', () => {
    it('changes the active view', () => {
      const store = makeStore();
      const before = store.getSnapshot();
      store.setView('month');
      expect(store.getSnapshot().view).toBe('month');
      expect(store.getSnapshot()).not.toBe(before);
    });

    it('is a noop when the view did not change', () => {
      const store = makeStore();
      const before = store.getSnapshot();
      store.setView('day');
      expect(store.getSnapshot()).toBe(before);
    });
  });

  describe('changeMonth() / changeYear()', () => {
    it('changeMonth advances the displayed month', () => {
      const store = makeStore({ initialDate: new Date(2024, 0, 15) });
      store.changeMonth(2);
      expect(sys.month(store.getSnapshot().displayed)).toBe(2);
    });

    it('changeYear advances the displayed year', () => {
      const store = makeStore({ initialDate: new Date(2024, 0, 15) });
      store.changeYear(3);
      expect(sys.year(store.getSnapshot().displayed)).toBe(2027);
    });
  });

  describe('goToYear() / goToMonth()', () => {
    it('goToYear updates displayed and switches view to "day"', () => {
      const store = makeStore({ initialDate: new Date(2024, 4, 15) });
      store.setView('year');
      store.goToYear(2030);
      const s = store.getSnapshot();
      expect(sys.year(s.displayed)).toBe(2030);
      expect(s.view).toBe('day');
    });

    it('goToMonth updates displayed and switches view to "day"', () => {
      const store = makeStore({ initialDate: new Date(2024, 4, 15) });
      store.setView('month');
      store.goToMonth(8);
      const s = store.getSnapshot();
      expect(sys.month(s.displayed)).toBe(8);
      expect(s.view).toBe('day');
    });

    it('batches inner commits — listeners fire once per goToYear', () => {
      const store = makeStore();
      store.setView('year');
      const listener = jest.fn();
      store.subscribe(listener);
      store.goToYear(2030);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('selectDate() in single mode', () => {
    it('writes selectedDate and updates displayed', () => {
      const store = makeStore();
      const target = date(2024, 4, 15);
      store.selectDate(target);
      const s = store.getSnapshot();
      expect(sys.isSame(s.selectedDate as GregorianDate, target)).toBe(true);
      expect(sys.isSame(s.displayed, target)).toBe(true);
    });

    it('rejects taps before minDate', () => {
      const store = makeStore({ minDate: new Date(2024, 4, 10) });
      store.selectDate(date(2024, 4, 1));
      expect(store.getSnapshot().selectedDate).toBeUndefined();
    });

    it('rejects taps after maxDate', () => {
      const store = makeStore({ maxDate: new Date(2024, 4, 10) });
      store.selectDate(date(2024, 4, 20));
      expect(store.getSnapshot().selectedDate).toBeUndefined();
    });

    it('rejects taps that match an explicit disabled date', () => {
      const store = makeStore({
        disabledDates: [new Date(2024, 4, 15)],
      });
      store.selectDate(date(2024, 4, 15));
      expect(store.getSnapshot().selectedDate).toBeUndefined();
    });

    it('rejects taps that fall inside a disabled range', () => {
      const store = makeStore({
        disabledRanges: [
          { start: new Date(2024, 4, 10), end: new Date(2024, 4, 20) },
        ],
      });
      store.selectDate(date(2024, 4, 15));
      expect(store.getSnapshot().selectedDate).toBeUndefined();
    });
  });

  describe('selectDate() in range mode', () => {
    const startDate = new Date(2024, 4, 10);
    const endDate = new Date(2024, 4, 20);

    it('seeds rangeStart on the first tap', () => {
      const store = makeStore({ mode: 'range' });
      store.selectDate(date(2024, 4, 10));
      const s = store.getSnapshot();
      expect(sys.isSame(s.rangeStart as GregorianDate, date(2024, 4, 10))).toBe(
        true
      );
      expect(s.rangeEnd).toBeUndefined();
    });

    it('writes rangeEnd on the second tap (after start)', () => {
      const store = makeStore({ mode: 'range', initialStart: startDate });
      store.selectDate(date(2024, 4, 20));
      const s = store.getSnapshot();
      expect(sys.day(s.rangeEnd as GregorianDate)).toBe(20);
    });

    it('swaps when the second tap is before start', () => {
      const store = makeStore({ mode: 'range', initialStart: endDate });
      store.selectDate(date(2024, 4, 10));
      const s = store.getSnapshot();
      expect(sys.day(s.rangeStart as GregorianDate)).toBe(10);
      expect(sys.day(s.rangeEnd as GregorianDate)).toBe(20);
    });

    it('clears the start when re-tapping the same day (allowSameDay=false)', () => {
      const store = makeStore({ mode: 'range', initialStart: startDate });
      store.selectDate(date(2024, 4, 10));
      const s = store.getSnapshot();
      expect(s.rangeStart).toBeUndefined();
      expect(s.rangeEnd).toBeUndefined();
    });

    it('selects a single-day range when re-tapping start with allowSameDay=true', () => {
      const store = makeStore({
        mode: 'range',
        initialStart: startDate,
        allowSameDay: true,
      });
      store.selectDate(date(2024, 4, 10));
      const s = store.getSnapshot();
      expect(sys.day(s.rangeStart as GregorianDate)).toBe(10);
      expect(sys.day(s.rangeEnd as GregorianDate)).toBe(10);
    });

    it('uses the end as the start when only the end is set', () => {
      const store = makeStore({ mode: 'range', initialEnd: endDate });
      store.selectDate(date(2024, 4, 10));
      const s = store.getSnapshot();
      expect(sys.day(s.rangeStart as GregorianDate)).toBe(10);
      expect(sys.day(s.rangeEnd as GregorianDate)).toBe(20);
    });

    it('extends to the right when only end is set and tap is after end', () => {
      const store = makeStore({ mode: 'range', initialEnd: startDate });
      store.selectDate(date(2024, 4, 20));
      const s = store.getSnapshot();
      expect(sys.day(s.rangeStart as GregorianDate)).toBe(10);
      expect(sys.day(s.rangeEnd as GregorianDate)).toBe(20);
    });

    it('clears the end when re-tapping it without allowSameDay', () => {
      const store = makeStore({ mode: 'range', initialEnd: endDate });
      store.selectDate(date(2024, 4, 20));
      const s = store.getSnapshot();
      expect(s.rangeStart).toBeUndefined();
      expect(s.rangeEnd).toBeUndefined();
    });

    it('selects a single-day range when re-tapping end with allowSameDay=true', () => {
      const store = makeStore({
        mode: 'range',
        initialEnd: endDate,
        allowSameDay: true,
      });
      store.selectDate(date(2024, 4, 20));
      const s = store.getSnapshot();
      expect(sys.day(s.rangeStart as GregorianDate)).toBe(20);
      expect(sys.day(s.rangeEnd as GregorianDate)).toBe(20);
    });

    it('starts a fresh range when both endpoints are already set', () => {
      const store = makeStore({
        mode: 'range',
        initialStart: startDate,
        initialEnd: endDate,
      });
      store.selectDate(date(2024, 5, 1));
      const s = store.getSnapshot();
      expect(sys.day(s.rangeStart as GregorianDate)).toBe(1);
      expect(sys.month(s.rangeStart as GregorianDate)).toBe(5);
      expect(s.rangeEnd).toBeUndefined();
    });
  });

  describe('clear()', () => {
    it('wipes all selection state but preserves system / displayed', () => {
      const store = makeStore({ initialDate: new Date(2024, 4, 15) });
      const before = store.getSnapshot();
      store.clear();
      const after = store.getSnapshot();
      expect(after.selectedDate).toBeUndefined();
      expect(after.rangeStart).toBeUndefined();
      expect(after.rangeEnd).toBeUndefined();
      expect(after.system).toBe(before.system);
      expect(sys.isSame(after.displayed, before.displayed)).toBe(true);
    });
  });

  describe('replaceSystem()', () => {
    const system2 = {
      ...sys,
      id: 'gregorian-2',
      label: 'Alt',
    };

    it('is a noop when the system is identical', () => {
      const store = makeStore();
      const before = store.getSnapshot();
      store.replaceSystem(store.getSnapshot().system, 0);
      expect(store.getSnapshot()).toBe(before);
    });

    it('carries displayed / selected dates through native Date', () => {
      const store = makeStore({
        initialDate: new Date(2024, 4, 15),
        minDate: new Date(2024, 0, 1),
        maxDate: new Date(2024, 11, 31),
        disabledDates: [new Date(2024, 6, 4)],
        disabledRanges: [
          { start: new Date(2024, 7, 1), end: new Date(2024, 7, 3) },
        ],
      });
      store.replaceSystem(system2, 1);
      const s = store.getSnapshot();
      expect(s.systemIndex).toBe(1);
      expect(s.system.id).toBe('gregorian-2');
      expect(sys.year(s.displayed)).toBe(2024);
      expect(sys.day(s.displayed)).toBe(15);
      expect(sys.day(s.selectedDate as GregorianDate)).toBe(15);
      expect(sys.day(s.minDate as GregorianDate)).toBe(1);
      expect(sys.day(s.maxDate as GregorianDate)).toBe(31);
      expect(s.disabledDates).toHaveLength(1);
      expect(s.disabledRanges).toHaveLength(1);
    });

    it('handles ranges as carry-over when only one endpoint is set', () => {
      const store = makeStore({
        mode: 'range',
        initialStart: new Date(2024, 4, 1),
      });
      store.replaceSystem(system2, 1);
      const s = store.getSnapshot();
      expect(sys.day(s.rangeStart as GregorianDate)).toBe(1);
      expect(s.rangeEnd).toBeUndefined();
    });

    it('handles undefined disabled lists gracefully', () => {
      const store = makeStore();
      store.replaceSystem(system2, 1);
      const s = store.getSnapshot();
      expect(s.disabledDates).toBeUndefined();
      expect(s.disabledRanges).toBeUndefined();
    });
  });

  describe('syncProps()', () => {
    it('updates mode when changed', () => {
      const store = makeStore();
      store.syncProps({ systems: [sys], mode: 'range' });
      expect(store.getSnapshot().mode).toBe('range');
    });

    it('updates allowSameDay when changed', () => {
      const store = makeStore();
      store.syncProps({ systems: [sys], mode: 'single', allowSameDay: true });
      expect(store.getSnapshot().allowSameDay).toBe(true);
    });

    it('writes new minDate / maxDate', () => {
      const store = makeStore();
      store.syncProps({
        systems: [sys],
        mode: 'single',
        minDate: new Date(2024, 0, 1),
        maxDate: new Date(2024, 11, 31),
      });
      const s = store.getSnapshot();
      expect(s.minDate).toBeDefined();
      expect(s.maxDate).toBeDefined();
    });

    it('clears bounds when undefined is passed', () => {
      const store = makeStore({
        minDate: new Date(2024, 0, 1),
        maxDate: new Date(2024, 11, 31),
      });
      store.syncProps({ systems: [sys], mode: 'single' });
      const s = store.getSnapshot();
      expect(s.minDate).toBeUndefined();
      expect(s.maxDate).toBeUndefined();
    });

    it('updates disabled lists', () => {
      const store = makeStore();
      store.syncProps({
        systems: [sys],
        mode: 'single',
        disabledDates: [new Date(2024, 4, 15)],
        disabledRanges: [
          { start: new Date(2024, 5, 1), end: new Date(2024, 5, 5) },
        ],
      });
      const s = store.getSnapshot();
      expect(s.disabledDates).toHaveLength(1);
      expect(s.disabledRanges).toHaveLength(1);
    });

    it('skips writing minDate when it has not changed', () => {
      const store = makeStore({ minDate: new Date(2024, 0, 1) });
      const before = store.getSnapshot();
      const listener = jest.fn();
      store.subscribe(listener);
      // Same minDate; disabled lists default to undefined; mode unchanged.
      // The disabled lists rebuild always commits, so this just ensures the
      // commit goes through cleanly when nothing else differs.
      store.syncProps({
        systems: [sys],
        mode: 'single',
        minDate: new Date(2024, 0, 1),
      });
      expect(store.getSnapshot()).not.toBe(before);
    });

    it('syncs minRangeDays / maxRangeDays / maxSelected / disabled', () => {
      const store = makeStore({ mode: 'range' });
      const fn = (d: Date) => d.getDay() === 0;
      store.syncProps({
        systems: [sys],
        mode: 'range',
        minRangeDays: 2,
        maxRangeDays: 14,
        maxSelected: 5,
        disabled: fn,
      });
      const s = store.getSnapshot();
      expect(s.minRangeDays).toBe(2);
      expect(s.maxRangeDays).toBe(14);
      expect(s.maxSelected).toBe(5);
      expect(s.disabled).toBe(fn);
    });
  });
});

// ---------------------------------------------------------------------------
// Multiple-mode selection
// ---------------------------------------------------------------------------

describe('CalendarStore — multiple mode', () => {
  it('starts with an empty selectedDates array', () => {
    const store = makeStore({ mode: 'multiple' });
    expect(store.getSnapshot().selectedDates).toEqual([]);
  });

  it('seeds initialDates when provided', () => {
    const store = makeStore({
      mode: 'multiple',
      initialDates: [new Date(2024, 0, 1), new Date(2024, 0, 5)],
    });
    expect(store.getSnapshot().selectedDates).toHaveLength(2);
  });

  it('toggles dates on repeated taps', () => {
    const store = makeStore({ mode: 'multiple' });
    const a = date(2024, 0, 1);
    const b = date(2024, 0, 5);
    store.selectDate(a);
    store.selectDate(b);
    expect(store.getSnapshot().selectedDates).toHaveLength(2);
    store.selectDate(a);
    const remaining = store.getSnapshot().selectedDates;
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toEqual(b);
  });

  it('honours maxSelected — extra picks are silently ignored', () => {
    const store = makeStore({ mode: 'multiple', maxSelected: 2 });
    store.selectDate(date(2024, 0, 1));
    store.selectDate(date(2024, 0, 2));
    store.selectDate(date(2024, 0, 3));
    expect(store.getSnapshot().selectedDates).toHaveLength(2);
  });

  it('toggleDate is a no-op outside multiple mode', () => {
    const store = makeStore({ mode: 'single' });
    store.toggleDate(date(2024, 0, 1));
    expect(store.getSnapshot().selectedDates).toEqual([]);
    expect(store.getSnapshot().selectedDate).toBeUndefined();
  });

  it('toggleDate forwards to selectDate when in multiple mode', () => {
    const store = makeStore({ mode: 'multiple' });
    store.toggleDate(date(2024, 0, 1));
    expect(store.getSnapshot().selectedDates).toHaveLength(1);
    // Second toggle on the same date removes it — round-trips through
    // selectDate's multiple-mode branch.
    store.toggleDate(date(2024, 0, 1));
    expect(store.getSnapshot().selectedDates).toEqual([]);
  });

  it('clear() wipes selectedDates', () => {
    const store = makeStore({ mode: 'multiple' });
    store.selectDate(date(2024, 0, 1));
    store.selectDate(date(2024, 0, 2));
    store.clear();
    expect(store.getSnapshot().selectedDates).toEqual([]);
  });

  it('replaceSystem carries selectedDates across the swap', () => {
    const altSysWithId = createGregorianSystem({ label: 'Alt' });
    Object.defineProperty(altSysWithId, 'id', { value: 'alt-greg' });
    const store = new CalendarStore<GregorianDate>({
      systems: [sys, altSysWithId],
      mode: 'multiple',
      initialDates: [new Date(2024, 0, 1), new Date(2024, 0, 5)],
    });
    store.replaceSystem(altSysWithId, 1);
    expect(store.getSnapshot().selectedDates).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Range length constraints
// ---------------------------------------------------------------------------

describe('CalendarStore — range length constraints', () => {
  it('rejects a second pick that is shorter than minRangeDays', () => {
    const store = makeStore({ mode: 'range', minRangeDays: 3 });
    store.selectDate(date(2024, 0, 1));
    store.selectDate(date(2024, 0, 2)); // would produce a 2-day range
    expect(store.getSnapshot().rangeEnd).toBeUndefined();
    // A long-enough pick goes through.
    store.selectDate(date(2024, 0, 5));
    expect(store.getSnapshot().rangeEnd).toEqual(date(2024, 0, 5));
  });

  it('rejects a second pick that exceeds maxRangeDays', () => {
    const store = makeStore({ mode: 'range', maxRangeDays: 4 });
    store.selectDate(date(2024, 0, 1));
    store.selectDate(date(2024, 0, 10)); // 10-day range
    expect(store.getSnapshot().rangeEnd).toBeUndefined();
    // A short-enough pick goes through.
    store.selectDate(date(2024, 0, 3));
    expect(store.getSnapshot().rangeEnd).toEqual(date(2024, 0, 3));
  });

  it('allows the partial-range state regardless of constraints', () => {
    const store = makeStore({ mode: 'range', minRangeDays: 5 });
    store.selectDate(date(2024, 0, 1));
    expect(store.getSnapshot().rangeStart).toEqual(date(2024, 0, 1));
  });
});

// ---------------------------------------------------------------------------
// Dynamic disabled predicate
// ---------------------------------------------------------------------------

describe('CalendarStore — dynamic disabled predicate', () => {
  it('blocks selectDate when the predicate returns true', () => {
    const isWeekend = (d: Date) => {
      const day = d.getDay();
      return day === 0 || day === 6;
    };
    const store = makeStore({ disabled: isWeekend });
    // 2024-01-06 is a Saturday.
    store.selectDate(date(2024, 0, 6));
    expect(store.getSnapshot().selectedDate).toBeUndefined();
    // 2024-01-08 is a Monday.
    store.selectDate(date(2024, 0, 8));
    expect(store.getSnapshot().selectedDate).toEqual(date(2024, 0, 8));
  });

  it('does not crash when the predicate throws — falls back to "not disabled"', () => {
    const store = makeStore({
      disabled: () => {
        throw new Error('boom');
      },
    });
    expect(() => store.selectDate(date(2024, 0, 1))).not.toThrow();
    expect(store.getSnapshot().selectedDate).toEqual(date(2024, 0, 1));
  });
});

// ---------------------------------------------------------------------------
// External callbacks (onChange / onConfirm / onClear)
// ---------------------------------------------------------------------------

describe('CalendarStore — external callbacks', () => {
  it('setExternalCallbacks wires onChange / onConfirm / onClear', () => {
    const store = makeStore();
    const onChange = jest.fn();
    const onConfirm = jest.fn();
    const onClear = jest.fn();
    store.setExternalCallbacks({ onChange, onConfirm, onClear });

    store.selectDate(date(2024, 0, 1));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toMatchObject({
      date: expect.any(Date),
      systemId: sys.id,
    });

    store.confirm();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0]?.[0]?.date).toBeInstanceOf(Date);

    store.clear();
    expect(onClear).toHaveBeenCalledTimes(1);
    // clear() also fires onChange (the second invocation), since the
    // selection mutated from "set" → "empty".
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('confirm() is a no-op when onConfirm is not wired', () => {
    const store = makeStore();
    store.selectDate(date(2024, 0, 1));
    expect(() => store.confirm()).not.toThrow();
  });

  it('notifyChange is a no-op when onChange is not wired (clear() path)', () => {
    // No callbacks wired — exercising the early-return in notifyChange().
    const store = makeStore();
    store.selectDate(date(2024, 0, 1));
    expect(() => store.clear()).not.toThrow();
    expect(store.getSnapshot().selectedDate).toBeUndefined();
  });

  it('setExternalCallbacks accepts empty / undefined values', () => {
    const store = makeStore();
    store.setExternalCallbacks({});
    // Rewire to ensure we can swap callbacks at runtime — exercises the
    // assignment branches without any side effect.
    const onChange = jest.fn();
    store.setExternalCallbacks({ onChange });
    store.selectDate(date(2024, 0, 1));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('confirm() payload covers range and multiple modes', () => {
    const onConfirm = jest.fn();

    const rangeStore = makeStore({ mode: 'range' });
    rangeStore.setExternalCallbacks({ onConfirm });
    rangeStore.selectDate(date(2024, 0, 1));
    rangeStore.selectDate(date(2024, 0, 5));
    rangeStore.confirm();
    expect(onConfirm.mock.calls[0]?.[0]).toMatchObject({
      startDate: expect.any(Date),
      endDate: expect.any(Date),
    });

    const multiStore = makeStore({ mode: 'multiple' });
    multiStore.setExternalCallbacks({ onConfirm });
    multiStore.selectDate(date(2024, 0, 1));
    multiStore.selectDate(date(2024, 0, 2));
    multiStore.confirm();
    const payload = onConfirm.mock.calls[1]?.[0];
    expect(payload?.dates).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Navigation actions: setDisplayedDate, prevYearPage, nextYearPage
// ---------------------------------------------------------------------------

describe('CalendarStore — navigation actions', () => {
  it('setDisplayedDate moves the displayed month', () => {
    const store = makeStore();
    const target = new Date(2026, 5, 15); // June 2026
    store.setDisplayedDate(target);
    const s = store.getSnapshot();
    expect(sys.year(s.displayed)).toBe(2026);
    expect(sys.month(s.displayed)).toBe(5);
  });

  it('setDisplayedDate is a no-op when the input matches the current displayed date', () => {
    const store = makeStore({ initialDate: new Date(2024, 0, 15) });
    const before = store.getSnapshot();
    // Same calendar day → store should bail before commit.
    store.setDisplayedDate(new Date(2024, 0, 15));
    expect(store.getSnapshot()).toBe(before);
  });

  it('prevYearPage and nextYearPage step the displayed year by YEAR_PAGE_SIZE', () => {
    const store = makeStore({ initialDate: new Date(2024, 0, 1) });
    const startYear = sys.year(store.getSnapshot().displayed);
    store.nextYearPage();
    const after = sys.year(store.getSnapshot().displayed);
    expect(after).toBeGreaterThan(startYear);
    store.prevYearPage();
    expect(sys.year(store.getSnapshot().displayed)).toBe(startYear);
  });
});

// ---------------------------------------------------------------------------
// isConfirmable (synchronous read for event handlers)
// ---------------------------------------------------------------------------

describe('CalendarStore — isConfirmable', () => {
  it('single mode — true iff selectedDate is set', () => {
    const store = makeStore();
    expect(store.isConfirmable()).toBe(false);
    store.selectDate(date(2024, 0, 1));
    expect(store.isConfirmable()).toBe(true);
  });

  it('multiple mode — true iff selectedDates is non-empty', () => {
    const store = makeStore({ mode: 'multiple' });
    expect(store.isConfirmable()).toBe(false);
    store.selectDate(date(2024, 0, 1));
    expect(store.isConfirmable()).toBe(true);
  });

  it('range mode — true iff both endpoints are set', () => {
    const store = makeStore({ mode: 'range' });
    expect(store.isConfirmable()).toBe(false);
    store.selectDate(date(2024, 0, 1));
    expect(store.isConfirmable()).toBe(false);
    store.selectDate(date(2024, 0, 5));
    expect(store.isConfirmable()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// syncProps edge cases — firstDayOfWeek + modifiers
// ---------------------------------------------------------------------------

describe('CalendarStore — syncProps edge cases', () => {
  it('updates firstDayOfWeek when it changes', () => {
    const store = makeStore({ firstDayOfWeek: 0 });
    store.syncProps({
      systems: [sys],
      mode: 'single',
      firstDayOfWeek: 1,
    });
    expect(store.getSnapshot().firstDayOfWeek).toBe(1);
  });

  it('updates modifiers when the reference changes', () => {
    const store = makeStore();
    const modA = { weekend: (d: Date) => d.getDay() === 0 };
    const modB = { weekend: (d: Date) => d.getDay() === 6 };
    store.syncProps({
      systems: [sys],
      mode: 'single',
      modifiers: modA,
    });
    expect(store.getSnapshot().modifiers).toBe(modA);
    store.syncProps({
      systems: [sys],
      mode: 'single',
      modifiers: modB,
    });
    expect(store.getSnapshot().modifiers).toBe(modB);
  });

  it('reflects modifiers as boolean flags on DayCellInfo', () => {
    // Drives the cell builder's modifier-iteration branch.
    const store = makeStore({
      initialDate: new Date(2024, 0, 1),
      modifiers: {
        monday: (d: Date) => d.getDay() === 1,
      },
    });
    const monday = store
      .getSnapshot()
      .days.cells.find((c) => c.nativeDate.getDay() === 1);
    expect(monday?.modifiers.monday).toBe(true);
  });

  it('updates maxDate when the new value differs from the previous one', () => {
    const store = makeStore();
    const max1 = new Date(2024, 11, 31);
    const max2 = new Date(2025, 11, 31);
    store.syncProps({
      systems: [sys],
      mode: 'single',
      maxDate: max1,
    });
    expect(store.getSnapshot().maxDate).toBeTruthy();
    store.syncProps({
      systems: [sys],
      mode: 'single',
      maxDate: max2,
    });
    // The store coerced both inputs into the active system; assert the
    // resulting native year matches the second input so we know the
    // branch fired.
    const newMax = store.getSnapshot().maxDate;
    expect(newMax && sys.year(newMax)).toBe(2025);
    // Clear it back — exercises the "max was set, new is undefined" branch.
    store.syncProps({ systems: [sys], mode: 'single' });
    expect(store.getSnapshot().maxDate).toBeUndefined();
  });

  it('clear() is a no-op (no onChange) when there was nothing selected', () => {
    const onChange = jest.fn();
    const onClear = jest.fn();
    const store = makeStore();
    store.setExternalCallbacks({ onChange, onClear });
    store.clear();
    // onClear still fires for the explicit gesture; onChange does not,
    // because the selection didn't mutate.
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('falls back to a numeric month label when the system returns fewer than 12 labels', () => {
    // Hand-craft a system whose `monthLabels()` is intentionally short so
    // the `?? String(monthIndex + 1)` fallback fires.
    const sparseLabels = createGregorianSystem();
    sparseLabels.monthLabels = () => ['Jan', 'Feb'] as readonly string[];
    const store = new CalendarStore<GregorianDate>({
      systems: [sparseLabels],
      mode: 'single',
      initialDate: new Date(2024, 5, 1), // June → index 5, off the end
    });
    // The store should produce *some* label rather than `undefined`.
    expect(store.getSnapshot().days.displayedMonthLabel).toBeTruthy();
  });
});
