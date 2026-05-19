import {
  createGregorianSystem,
  type GregorianDate,
} from '../../systems/gregorian';
import { MultipleCalendarStore } from '../../stores/MultipleCalendarStore';
import type { CalendarSystem } from '../../types';

const sys = createGregorianSystem();
const sys2: CalendarSystem<GregorianDate> = {
  ...createGregorianSystem(),
  id: 'greg2',
};

const makeStore = (overrides: Partial<ConstructorParameters<typeof MultipleCalendarStore>[0]> = {}) =>
  new MultipleCalendarStore({
    systems: [sys],
    ...overrides,
  });

describe('MultipleCalendarStore — bootstrap', () => {
  it('starts with initialDates applied', () => {
    const store = makeStore({
      initialDates: [new Date(2024, 4, 10), new Date(2024, 4, 12)],
    });
    expect(store.getSnapshot().selectedDates).toHaveLength(2);
    expect(store.getSnapshot().mode).toBe('multiple');
  });

  it('seeds displayed from the first initial date', () => {
    const store = makeStore({ initialDates: [new Date(2025, 8, 1)] });
    expect((store.getSnapshot().displayed as GregorianDate).y).toBe(2025);
    expect((store.getSnapshot().displayed as GregorianDate).m).toBe(8);
  });

  it('falls back to today() when initialDates is empty', () => {
    const store = makeStore({ initialDates: [] });
    expect(store.getSnapshot().selectedDates).toHaveLength(0);
  });
});

describe('MultipleCalendarStore — selectDate', () => {
  it('adds a new date to the selection', () => {
    const onChange = jest.fn();
    const store = makeStore({ onChange });
    store.selectDate(new Date(2024, 4, 10));
    expect(store.getSnapshot().selectedDates).toHaveLength(1);
    expect(onChange).toHaveBeenCalled();
  });

  it('removes a date that is already selected (toggle)', () => {
    const store = makeStore({ initialDates: [new Date(2024, 4, 10)] });
    store.selectDate(new Date(2024, 4, 10));
    expect(store.getSnapshot().selectedDates).toHaveLength(0);
  });

  it('refuses to add beyond maxSelected', () => {
    const onChange = jest.fn();
    const store = makeStore({
      initialDates: [new Date(2024, 4, 10), new Date(2024, 4, 11)],
      maxSelected: 2,
      onChange,
    });
    store.selectDate(new Date(2024, 4, 12));
    expect(store.getSnapshot().selectedDates).toHaveLength(2);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('allows removing when at the maxSelected cap', () => {
    const store = makeStore({
      initialDates: [new Date(2024, 4, 10), new Date(2024, 4, 11)],
      maxSelected: 2,
    });
    store.selectDate(new Date(2024, 4, 10));
    expect(store.getSnapshot().selectedDates).toHaveLength(1);
  });

  it('is a no-op for disabled dates', () => {
    const onChange = jest.fn();
    const store = makeStore({
      minDate: new Date(2024, 4, 10),
      onChange,
    });
    store.selectDate(new Date(2024, 4, 1));
    expect(store.getSnapshot().selectedDates).toHaveLength(0);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('MultipleCalendarStore — clear / confirm', () => {
  it('clear empties selection and fires callbacks', () => {
    const onClear = jest.fn();
    const onChange = jest.fn();
    const store = makeStore({
      initialDates: [new Date(2024, 4, 10)],
      onClear,
      onChange,
    });
    store.clear();
    expect(store.getSnapshot().selectedDates).toHaveLength(0);
    expect(onClear).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
  });

  it('clear with empty selection does not fire onChange', () => {
    const onChange = jest.fn();
    const onClear = jest.fn();
    const store = makeStore({ onClear, onChange });
    store.clear();
    expect(onClear).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('confirm passes a payload with native dates and parts', () => {
    const onConfirm = jest.fn();
    const store = makeStore({
      initialDates: [new Date(2024, 4, 10), new Date(2024, 4, 12)],
      onConfirm,
    });
    store.confirm();
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        dates: expect.any(Array),
        parts: [
          { year: 2024, month: 4, day: 10 },
          { year: 2024, month: 4, day: 12 },
        ],
        systemId: 'gregorian',
      })
    );
  });

  it('confirm is a no-op without a registered callback', () => {
    const store = makeStore();
    expect(() => store.confirm()).not.toThrow();
  });

  it('isConfirmable reflects selection presence', () => {
    const store = makeStore();
    expect(store.isConfirmable()).toBe(false);
    store.selectDate(new Date(2024, 4, 10));
    expect(store.isConfirmable()).toBe(true);
  });
});

describe('MultipleCalendarStore — day cells & configure', () => {
  it('flags isSelected on every selected date in the grid', () => {
    const store = makeStore({
      initialDates: [new Date(2024, 4, 10), new Date(2024, 4, 12)],
    });
    const cells = store.getSnapshot().days.cells;
    const inMonth = cells.filter((c) => c.isCurrentMonth);
    const ten = inMonth.find((c) => c.nativeDate.getDate() === 10);
    const eleven = inMonth.find((c) => c.nativeDate.getDate() === 11);
    const twelve = inMonth.find((c) => c.nativeDate.getDate() === 12);
    expect(ten?.isSelected).toBe(true);
    expect(eleven?.isSelected).toBe(false);
    expect(twelve?.isSelected).toBe(true);
  });

  it('configure updates maxSelected', () => {
    const store = makeStore();
    store.configure({ systems: [sys], maxSelected: 3 });
    expect(store.getSnapshot().maxSelected).toBe(3);
  });

  it('carries selection across calendar systems', () => {
    const store = new MultipleCalendarStore({
      systems: [sys, sys2],
      initialDates: [new Date(2024, 4, 10)],
    });
    store.setActiveSystem('greg2');
    expect(store.getSnapshot().selectedDates).toHaveLength(1);
  });
});
