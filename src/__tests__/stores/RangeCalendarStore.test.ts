import {
  createGregorianSystem,
  type GregorianDate,
} from '../../systems/gregorian';
import { RangeCalendarStore } from '../../stores/RangeCalendarStore';
import type { CalendarSystem } from '../../types';

const sys = createGregorianSystem();
const sys2: CalendarSystem<GregorianDate> = {
  ...createGregorianSystem(),
  id: 'greg2',
};

const d = (y: number, m: number, day: number) =>
  sys.fromNativeDate(new Date(y, m, day));

const makeStore = (overrides: Partial<ConstructorParameters<typeof RangeCalendarStore>[0]> = {}) =>
  new RangeCalendarStore({
    systems: [sys],
    ...overrides,
  });

describe('RangeCalendarStore — bootstrap', () => {
  it('starts with initialStart and initialEnd applied', () => {
    const store = makeStore({
      initialStart: new Date(2024, 4, 10),
      initialEnd: new Date(2024, 4, 20),
    });
    const s = store.getSnapshot();
    expect(s.rangeStart).toEqual(d(2024, 4, 10));
    expect(s.rangeEnd).toEqual(d(2024, 4, 20));
    expect(s.mode).toBe('range');
  });

  it('seeds displayed from initialEnd when only initialEnd is provided', () => {
    const store = makeStore({ initialEnd: new Date(2025, 5, 5) });
    expect((store.getSnapshot().displayed as GregorianDate).m).toBe(5);
    expect(store.getSnapshot().rangeStart).toBeUndefined();
    expect(store.getSnapshot().rangeEnd).toEqual(d(2025, 5, 5));
  });
});

describe('RangeCalendarStore — selectDate behavior', () => {
  it('sets rangeStart on first click', () => {
    const store = makeStore();
    store.selectDate(new Date(2024, 4, 10));
    expect(store.getSnapshot().rangeStart).toEqual(d(2024, 4, 10));
    expect(store.getSnapshot().rangeEnd).toBeUndefined();
  });

  it('sets rangeEnd on second click after start', () => {
    const store = makeStore();
    store.selectDate(new Date(2024, 4, 10));
    store.selectDate(new Date(2024, 4, 20));
    expect(store.getSnapshot().rangeStart).toEqual(d(2024, 4, 10));
    expect(store.getSnapshot().rangeEnd).toEqual(d(2024, 4, 20));
  });

  it('swaps when the second click is before the existing start', () => {
    const store = makeStore({ initialStart: new Date(2024, 4, 20) });
    store.selectDate(new Date(2024, 4, 5));
    expect(store.getSnapshot().rangeStart).toEqual(d(2024, 4, 5));
    expect(store.getSnapshot().rangeEnd).toEqual(d(2024, 4, 20));
  });

  it('clears when clicking start === end without allowSameDay', () => {
    const store = makeStore({ initialStart: new Date(2024, 4, 10) });
    store.selectDate(new Date(2024, 4, 10));
    expect(store.getSnapshot().rangeStart).toBeUndefined();
    expect(store.getSnapshot().rangeEnd).toBeUndefined();
  });

  it('keeps same-day range when allowSameDay is true', () => {
    const store = makeStore({
      initialStart: new Date(2024, 4, 10),
      allowSameDay: true,
    });
    store.selectDate(new Date(2024, 4, 10));
    expect(store.getSnapshot().rangeStart).toEqual(d(2024, 4, 10));
    expect(store.getSnapshot().rangeEnd).toEqual(d(2024, 4, 10));
  });

  it('handles the rangeEnd-only branch (start undefined, end set) via swap', () => {
    const store = makeStore({ initialEnd: new Date(2024, 4, 20) });
    store.selectDate(new Date(2024, 4, 10));
    expect(store.getSnapshot().rangeStart).toEqual(d(2024, 4, 10));
    expect(store.getSnapshot().rangeEnd).toEqual(d(2024, 4, 20));
  });

  it('handles the rangeEnd-only branch when new date is after the end', () => {
    const store = makeStore({ initialEnd: new Date(2024, 4, 10) });
    store.selectDate(new Date(2024, 4, 20));
    expect(store.getSnapshot().rangeStart).toEqual(d(2024, 4, 10));
    expect(store.getSnapshot().rangeEnd).toEqual(d(2024, 4, 20));
  });

  it('handles the rangeEnd-only branch with same-day click clearing', () => {
    const store = makeStore({ initialEnd: new Date(2024, 4, 10) });
    store.selectDate(new Date(2024, 4, 10));
    expect(store.getSnapshot().rangeStart).toBeUndefined();
    expect(store.getSnapshot().rangeEnd).toBeUndefined();
  });

  it('handles the rangeEnd-only branch with same-day click and allowSameDay', () => {
    const store = makeStore({
      initialEnd: new Date(2024, 4, 10),
      allowSameDay: true,
    });
    store.selectDate(new Date(2024, 4, 10));
    expect(store.getSnapshot().rangeStart).toEqual(d(2024, 4, 10));
    expect(store.getSnapshot().rangeEnd).toEqual(d(2024, 4, 10));
  });

  it('resets to a new start when both ends already set', () => {
    const store = makeStore({
      initialStart: new Date(2024, 4, 10),
      initialEnd: new Date(2024, 4, 20),
    });
    store.selectDate(new Date(2024, 5, 5));
    expect(store.getSnapshot().rangeStart).toEqual(d(2024, 5, 5));
    expect(store.getSnapshot().rangeEnd).toBeUndefined();
  });

  it('is a no-op for disabled dates', () => {
    const onChange = jest.fn();
    const store = makeStore({
      minDate: new Date(2024, 4, 10),
      onChange,
    });
    store.selectDate(new Date(2024, 4, 5));
    expect(store.getSnapshot().rangeStart).toBeUndefined();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rejects a range shorter than minRangeDays', () => {
    const store = makeStore({
      initialStart: new Date(2024, 4, 10),
      minRangeDays: 5,
    });
    store.selectDate(new Date(2024, 4, 11));
    expect(store.getSnapshot().rangeEnd).toBeUndefined();
  });

  it('rejects a range longer than maxRangeDays', () => {
    const store = makeStore({
      initialStart: new Date(2024, 4, 10),
      maxRangeDays: 3,
    });
    store.selectDate(new Date(2024, 4, 20));
    expect(store.getSnapshot().rangeEnd).toBeUndefined();
  });

  it('enforces only-minRangeDays when maxRangeDays is unset', () => {
    const store = makeStore({
      initialStart: new Date(2024, 4, 10),
      minRangeDays: 5,
    });
    store.selectDate(new Date(2024, 4, 11));
    expect(store.getSnapshot().rangeEnd).toBeUndefined();
    store.selectDate(new Date(2024, 4, 20));
    expect(store.getSnapshot().rangeEnd).toEqual(d(2024, 4, 20));
  });

  it('enforces only-maxRangeDays when minRangeDays is unset', () => {
    const store = makeStore({
      initialStart: new Date(2024, 4, 10),
      maxRangeDays: 3,
    });
    store.selectDate(new Date(2024, 4, 20));
    expect(store.getSnapshot().rangeEnd).toBeUndefined();
    store.selectDate(new Date(2024, 4, 12));
    expect(store.getSnapshot().rangeEnd).toEqual(d(2024, 4, 12));
  });

  it('accepts a valid range within both bounds', () => {
    const store = makeStore({
      initialStart: new Date(2024, 4, 10),
      minRangeDays: 2,
      maxRangeDays: 10,
    });
    store.selectDate(new Date(2024, 4, 15));
    expect(store.getSnapshot().rangeEnd).toEqual(d(2024, 4, 15));
  });
});

describe('RangeCalendarStore — clear / confirm / payload', () => {
  it('clear empties both ends and fires callbacks', () => {
    const onClear = jest.fn();
    const onChange = jest.fn();
    const store = makeStore({
      initialStart: new Date(2024, 4, 10),
      initialEnd: new Date(2024, 4, 20),
      onClear,
      onChange,
    });
    store.clear();
    expect(store.getSnapshot().rangeStart).toBeUndefined();
    expect(store.getSnapshot().rangeEnd).toBeUndefined();
    expect(onClear).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
  });

  it('clear without an existing selection fires onClear but not onChange', () => {
    const onChange = jest.fn();
    const onClear = jest.fn();
    const store = makeStore({ onClear, onChange });
    store.clear();
    expect(onClear).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('confirm fires onConfirm with both ends', () => {
    const onConfirm = jest.fn();
    const store = makeStore({
      initialStart: new Date(2024, 4, 10),
      initialEnd: new Date(2024, 4, 20),
      onConfirm,
    });
    store.confirm();
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        startParts: { year: 2024, month: 4, day: 10 },
        endParts: { year: 2024, month: 4, day: 20 },
        systemId: 'gregorian',
      })
    );
  });

  it('confirm is a no-op when no callback is registered', () => {
    const store = makeStore();
    expect(() => store.confirm()).not.toThrow();
  });

  it('isConfirmable returns true only when both ends are set', () => {
    const store = makeStore();
    expect(store.isConfirmable()).toBe(false);
    store.selectDate(new Date(2024, 4, 10));
    expect(store.isConfirmable()).toBe(false);
    store.selectDate(new Date(2024, 4, 20));
    expect(store.isConfirmable()).toBe(true);
  });

  it('builds an empty payload after clear() wipes an existing selection', () => {
    const onConfirm = jest.fn();
    const store = makeStore({
      initialStart: new Date(2024, 4, 10),
      initialEnd: new Date(2024, 4, 12),
      onConfirm,
    });
    store.clear();
    store.confirm();
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: undefined,
        endDate: undefined,
        startParts: undefined,
        endParts: undefined,
      })
    );
  });

  it('builds an empty payload when nothing is selected', () => {
    const onConfirm = jest.fn();
    const store = makeStore({ onConfirm });
    store.confirm();
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: undefined,
        endDate: undefined,
        startParts: undefined,
        endParts: undefined,
      })
    );
  });
});

describe('RangeCalendarStore — day cells', () => {
  it('flags isRangeStart/isRangeEnd/inRange on the correct cells', () => {
    const store = makeStore({
      initialStart: new Date(2024, 4, 10),
      initialEnd: new Date(2024, 4, 12),
    });
    const cells = store.getSnapshot().days.cells;
    const inMonth = cells.filter((c) => c.isCurrentMonth);
    const start = inMonth.find((c) => c.nativeDate.getDate() === 10);
    const middle = inMonth.find((c) => c.nativeDate.getDate() === 11);
    const end = inMonth.find((c) => c.nativeDate.getDate() === 12);
    expect(start?.isRangeStart).toBe(true);
    expect(start?.isRangeEnd).toBe(false);
    expect(start?.inRange).toBe(false);
    expect(middle?.inRange).toBe(true);
    expect(end?.isRangeEnd).toBe(true);
  });
});

describe('RangeCalendarStore — configure / reconcile', () => {
  it('updates range options via configure', () => {
    const store = makeStore({ initialStart: new Date(2024, 4, 10) });
    store.configure({
      systems: [sys],
      allowSameDay: true,
      minRangeDays: 1,
      maxRangeDays: 30,
    });
    expect(store.getSnapshot().allowSameDay).toBe(true);
    expect(store.getSnapshot().minRangeDays).toBe(1);
    expect(store.getSnapshot().maxRangeDays).toBe(30);
  });

  it('resets allowSameDay to false when omitted from configure', () => {
    const store = makeStore({ allowSameDay: true });
    store.configure({ systems: [sys] });
    expect(store.getSnapshot().allowSameDay).toBe(false);
  });

  it('carries rangeStart/rangeEnd across calendar systems', () => {
    const store = new RangeCalendarStore({
      systems: [sys, sys2],
      initialStart: new Date(2024, 4, 10),
      initialEnd: new Date(2024, 4, 20),
    });
    store.setActiveSystem('greg2');
    expect(store.getSnapshot().system.id).toBe('greg2');
    expect(store.getSnapshot().rangeStart).toBeDefined();
    expect(store.getSnapshot().rangeEnd).toBeDefined();
  });

  it('carries undefined rangeStart/rangeEnd across systems', () => {
    const store = new RangeCalendarStore({ systems: [sys, sys2] });
    store.setActiveSystem('greg2');
    expect(store.getSnapshot().rangeStart).toBeUndefined();
    expect(store.getSnapshot().rangeEnd).toBeUndefined();
  });

  it('does not re-commit when configure values match', () => {
    const store = makeStore({ allowSameDay: true, minRangeDays: 2 });
    const listener = jest.fn();
    store.subscribe(listener);
    store.configure({ systems: [sys], allowSameDay: true, minRangeDays: 2 });
    expect(listener).not.toHaveBeenCalled();
  });
});
