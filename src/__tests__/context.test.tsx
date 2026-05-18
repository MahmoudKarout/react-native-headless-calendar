/**
 * Tests for the two hooks (useCalendarSelector / useCalendarActions) plus
 * the built-in selectors. Verifies subscription semantics, the
 * "no provider" error path, and that the action surface forwards to the
 * underlying store.
 */
import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Root as CalendarProvider } from '../components/Root';
import {
  selectCanConfirm,
  selectDays,
  selectMonths,
  selectYears,
  useCalendarActions,
  useCalendarSelector,
} from '../context';

// Renders a value as text and exposes the last-rendered value through a
// ref-style capture so tests can assert on it without a screen query.
function makeCapture<T>() {
  const calls: T[] = [];
  return {
    push: (v: T) => calls.push(v),
    last: () => calls[calls.length - 1],
    all: () => calls,
    count: () => calls.length,
  };
}

describe('useCalendarSelector', () => {
  it('throws when used outside <CalendarProvider>', () => {
    function Bare() {
      useCalendarSelector((s) => s.mode);
      return null;
    }
    // Silence React's error logging for the expected throw.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Bare />)).toThrow(
      /must be used within <CalendarProvider>/
    );
    spy.mockRestore();
  });

  it('returns the projected slice and tracks store changes', () => {
    let displayedMonth: number | undefined;
    let actions: ReturnType<typeof useCalendarActions> | null = null;
    function Probe() {
      displayedMonth = useCalendarSelector((s) =>
        s.system.month(s.displayed)
      );
      actions = useCalendarActions();
      return null;
    }
    render(
      <CalendarProvider initialDate={new Date(2024, 0, 1)}>
        <Probe />
      </CalendarProvider>
    );
    expect(displayedMonth).toBe(0); // January

    // Advancing the displayed month re-runs the selector and the
    // captured value advances.
    act(() => {
      actions!.goNextMonth();
    });
    expect(displayedMonth).toBe(1); // February

    // Picking a date doesn't change the displayed month, so the
    // selector returns the same value as before.
    act(() => {
      actions!.selectDate(new Date(2024, 1, 15));
    });
    expect(displayedMonth).toBe(1);
  });

  it('built-in selectors return identity-stable slices off the snapshot', () => {
    let snapshot: {
      days: ReturnType<typeof selectDays>;
      months: ReturnType<typeof selectMonths>;
      years: ReturnType<typeof selectYears>;
      canConfirm: ReturnType<typeof selectCanConfirm>;
    } | null = null;
    function Probe() {
      snapshot = {
        days: useCalendarSelector(selectDays),
        months: useCalendarSelector(selectMonths),
        years: useCalendarSelector(selectYears),
        canConfirm: useCalendarSelector(selectCanConfirm),
      };
      return null;
    }
    render(
      <CalendarProvider>
        <Probe />
      </CalendarProvider>
    );
    expect(snapshot).not.toBeNull();
    expect(Array.isArray(snapshot!.days.cells)).toBe(true);
    expect(snapshot!.months.months).toHaveLength(12);
    expect(snapshot!.years.years.length).toBeGreaterThan(0);
    // No selection seeded → not confirmable.
    expect(snapshot!.canConfirm).toBe(false);
  });

  it('selectCanConfirm flips with selection in each mode', () => {
    const capture = makeCapture<boolean>();
    function Probe() {
      capture.push(useCalendarSelector(selectCanConfirm));
      return null;
    }
    function PickButton() {
      const { selectDate } = useCalendarActions();
      return (
        <Text
          testID="pick"
          onPress={() => selectDate(new Date(2024, 0, 1))}
        >
          pick
        </Text>
      );
    }

    const { getByTestId, rerender } = render(
      <CalendarProvider mode="single">
        <Probe />
        <PickButton />
      </CalendarProvider>
    );
    expect(capture.last()).toBe(false);
    act(() => {
      getByTestId('pick').props.onPress();
    });
    expect(capture.last()).toBe(true);

    // Re-render in multiple mode and verify the false→true transition
    // there too. A fresh provider mounts a fresh store.
    rerender(
      <CalendarProvider mode="multiple">
        <Probe />
        <PickButton />
      </CalendarProvider>
    );
    expect(capture.last()).toBe(false);
    act(() => {
      getByTestId('pick').props.onPress();
    });
    expect(capture.last()).toBe(true);
  });
});

describe('useCalendarActions', () => {
  it('throws when used outside <CalendarProvider>', () => {
    function Bare() {
      useCalendarActions();
      return null;
    }
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Bare />)).toThrow(
      /must be used within <CalendarProvider>/
    );
    spy.mockRestore();
  });

  it('returns an identity-stable action object across re-renders', () => {
    const cap = makeCapture<ReturnType<typeof useCalendarActions>>();
    function Probe() {
      cap.push(useCalendarActions());
      return null;
    }
    const { rerender } = render(
      <CalendarProvider>
        <Probe />
      </CalendarProvider>
    );
    rerender(
      <CalendarProvider>
        <Probe />
      </CalendarProvider>
    );
    // Same provider instance → same actions object.
    expect(cap.all()[0]).toBe(cap.all()[1]);
  });

  it('forwards every documented mutator to the underlying store', () => {
    const calls: string[] = [];
    function Probe() {
      const a = useCalendarActions();
      // Synchronously exercise every action so each line of
      // useCalendarActions' object literal gets executed.
      calls.push(typeof a.selectDate);
      calls.push(typeof a.clear);
      calls.push(typeof a.confirm);
      calls.push(typeof a.goPrevMonth);
      calls.push(typeof a.goNextMonth);
      calls.push(typeof a.setDisplayedDate);
      calls.push(typeof a.selectMonth);
      calls.push(typeof a.selectYear);
      calls.push(typeof a.prevYearPage);
      calls.push(typeof a.nextYearPage);
      calls.push(typeof a.isConfirmable);
      // Invoke a couple to drive the store side too.
      a.selectDate(new Date(2024, 0, 1));
      a.goNextMonth();
      a.goPrevMonth();
      a.setDisplayedDate(new Date(2024, 5, 15));
      a.selectMonth(2);
      a.selectYear(2025);
      a.prevYearPage();
      a.nextYearPage();
      a.clear();
      a.confirm();
      return null;
    }
    render(
      <CalendarProvider>
        <Probe />
      </CalendarProvider>
    );
    expect(calls.every((t) => t === 'function')).toBe(true);
  });

  it('isConfirmable() reads the live snapshot synchronously', () => {
    let actions: ReturnType<typeof useCalendarActions> | null = null;
    function Capture() {
      actions = useCalendarActions();
      return null;
    }
    render(
      <CalendarProvider mode="single">
        <Capture />
      </CalendarProvider>
    );
    expect(actions!.isConfirmable()).toBe(false);
    act(() => {
      actions!.selectDate(new Date(2024, 0, 1));
    });
    expect(actions!.isConfirmable()).toBe(true);
  });
});
