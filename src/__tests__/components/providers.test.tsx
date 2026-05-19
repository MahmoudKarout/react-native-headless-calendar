import { fireEvent, render } from '@testing-library/react-native';
import { useEffect, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MultipleDateProvider } from '../../components/MultipleDateProvider';
import { RangeDateProvider } from '../../components/RangeDateProvider';
import { SingleDateProvider } from '../../components/SingleDateProvider';
import {
  selectMultipleCanConfirm,
  selectMultipleDays,
  selectMultipleMonths,
  selectMultipleYears,
  useMultipleCalendarActions,
  useMultipleCalendarSelector,
} from '../../contexts/multiple';
import {
  selectRangeCanConfirm,
  selectRangeDays,
  selectRangeMonths,
  selectRangeYears,
  useRangeCalendarActions,
  useRangeCalendarSelector,
} from '../../contexts/range';
import {
  selectSingleCanConfirm,
  selectSingleDays,
  selectSingleMonths,
  selectSingleYears,
  useSingleCalendarActions,
  useSingleCalendarSelector,
} from '../../contexts/single';
import { createGregorianSystem } from '../../systems/gregorian';
import type { CalendarSystem } from '../../types';

const sys = createGregorianSystem();
const sys2: CalendarSystem = {
  ...createGregorianSystem({ label: 'Greg2' }),
  id: 'greg2',
};

// -- Single-mode provider ---------------------------------------------------

describe('SingleDateProvider', () => {
  function SingleProbe({ onMount }: { onMount?: (api: unknown) => void }) {
    const days = useSingleCalendarSelector(selectSingleDays);
    const months = useSingleCalendarSelector(selectSingleMonths);
    const years = useSingleCalendarSelector(selectSingleYears);
    const canConfirm = useSingleCalendarSelector(selectSingleCanConfirm);
    const actions = useSingleCalendarActions();
    useEffect(() => {
      onMount?.({ actions });
    }, [onMount, actions]);
    return (
      <View>
        <Text testID="cells">{days.cells.length}</Text>
        <Text testID="month">{months.activeMonth}</Text>
        <Text testID="year">{years.activeYear}</Text>
        <Text testID="canConfirm">{canConfirm ? 'yes' : 'no'}</Text>
      </View>
    );
  }

  it('renders selectors and exposes actions', () => {
    let captured: { actions: ReturnType<typeof useSingleCalendarActions> } | null =
      null;
    const ui = render(
      <SingleDateProvider initialDate={new Date(2024, 4, 15)}>
        <SingleProbe onMount={(api) => (captured = api as never)} />
      </SingleDateProvider>
    );
    expect(ui.getByTestId('cells').props.children).toBe(42);
    expect(ui.getByTestId('month').props.children).toBe(4);
    expect(ui.getByTestId('canConfirm').props.children).toBe('yes');
    expect(typeof captured!.actions.selectDate).toBe('function');
    expect(typeof captured!.actions.goPrevMonth).toBe('function');
    expect(typeof captured!.actions.isConfirmable).toBe('function');
  });

  it('throws when hooks are used outside the provider', () => {
    const Bad = () => {
      useSingleCalendarSelector(selectSingleDays);
      return null;
    };
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Bad />)).toThrow(/SingleDateProvider/);
    error.mockRestore();
  });

  it('reflects updates from configure (live prop sync)', () => {
    const Probe = () => {
      const days = useSingleCalendarSelector(selectSingleDays);
      return <Text testID="weekdays">{days.weekdayLabels.join(',')}</Text>;
    };
    const ui = render(
      <SingleDateProvider initialDate={new Date(2024, 4, 15)} firstDayOfWeek={1}>
        <Probe />
      </SingleDateProvider>
    );
    const labelsMon = ui.getByTestId('weekdays').props.children;
    ui.rerender(
      <SingleDateProvider initialDate={new Date(2024, 4, 15)} firstDayOfWeek={0}>
        <Probe />
      </SingleDateProvider>
    );
    expect(ui.getByTestId('weekdays').props.children).not.toBe(labelsMon);
  });

  it('honours selectDate, clear, confirm via the actions hook', () => {
    const onConfirm = jest.fn();
    const Probe = () => {
      const actions = useSingleCalendarActions();
      const canConfirm = useSingleCalendarSelector(selectSingleCanConfirm);
      return (
        <View>
          <Text testID="canConfirm">{canConfirm ? 'yes' : 'no'}</Text>
          <Pressable
            testID="select"
            onPress={() => actions.selectDate(new Date(2024, 4, 20))}
          />
          <Pressable testID="confirm" onPress={() => actions.confirm()} />
          <Pressable testID="clear" onPress={() => actions.clear()} />
          <Pressable testID="next" onPress={() => actions.goNextMonth()} />
          <Pressable testID="prev" onPress={() => actions.goPrevMonth()} />
          <Pressable
            testID="setDisplayed"
            onPress={() => actions.setDisplayedDate(new Date(2025, 0, 1))}
          />
          <Pressable testID="selectMonth" onPress={() => actions.selectMonth(2)} />
          <Pressable testID="selectYear" onPress={() => actions.selectYear(2030)} />
          <Pressable testID="prevYearPage" onPress={() => actions.prevYearPage()} />
          <Pressable testID="nextYearPage" onPress={() => actions.nextYearPage()} />
          <Pressable
            testID="setSystem"
            onPress={() => actions.setActiveSystem('greg2')}
          />
        </View>
      );
    };
    const ui = render(
      <SingleDateProvider
        systems={[sys, sys2]}
        onConfirm={onConfirm}
      >
        <Probe />
      </SingleDateProvider>
    );
    expect(ui.getByTestId('canConfirm').props.children).toBe('no');
    fireEvent.press(ui.getByTestId('select'));
    expect(ui.getByTestId('canConfirm').props.children).toBe('yes');
    fireEvent.press(ui.getByTestId('confirm'));
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.press(ui.getByTestId('clear'));
    expect(ui.getByTestId('canConfirm').props.children).toBe('no');
    fireEvent.press(ui.getByTestId('next'));
    fireEvent.press(ui.getByTestId('prev'));
    fireEvent.press(ui.getByTestId('setDisplayed'));
    fireEvent.press(ui.getByTestId('selectMonth'));
    fireEvent.press(ui.getByTestId('selectYear'));
    fireEvent.press(ui.getByTestId('prevYearPage'));
    fireEvent.press(ui.getByTestId('nextYearPage'));
    fireEvent.press(ui.getByTestId('setSystem'));
  });
});

// -- Range-mode provider ----------------------------------------------------

describe('RangeDateProvider', () => {
  it('renders selectors and reacts to selectDate', () => {
    const Probe = () => {
      const days = useRangeCalendarSelector(selectRangeDays);
      const months = useRangeCalendarSelector(selectRangeMonths);
      const years = useRangeCalendarSelector(selectRangeYears);
      const canConfirm = useRangeCalendarSelector(selectRangeCanConfirm);
      const actions = useRangeCalendarActions();
      return (
        <View>
          <Text testID="cells">{days.cells.length}</Text>
          <Text testID="month">{months.activeMonth}</Text>
          <Text testID="year">{years.activeYear}</Text>
          <Text testID="canConfirm">{canConfirm ? 'yes' : 'no'}</Text>
          <Pressable
            testID="start"
            onPress={() => actions.selectDate(new Date(2024, 4, 10))}
          />
          <Pressable
            testID="end"
            onPress={() => actions.selectDate(new Date(2024, 4, 20))}
          />
          <Pressable testID="clear" onPress={() => actions.clear()} />
        </View>
      );
    };
    const ui = render(
      <RangeDateProvider>
        <Probe />
      </RangeDateProvider>
    );
    fireEvent.press(ui.getByTestId('start'));
    fireEvent.press(ui.getByTestId('end'));
    expect(ui.getByTestId('canConfirm').props.children).toBe('yes');
    fireEvent.press(ui.getByTestId('clear'));
    expect(ui.getByTestId('canConfirm').props.children).toBe('no');
  });

  it('throws when hooks are used outside the provider', () => {
    const Bad = () => {
      useRangeCalendarSelector(selectRangeDays);
      return null;
    };
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Bad />)).toThrow(/RangeDateProvider/);
    error.mockRestore();
  });

  it('forwards allowSameDay / minRangeDays / maxRangeDays to the store', () => {
    const Probe = ({ children }: { children?: ReactNode }) => <>{children}</>;
    const Snapshot = () => {
      const days = useRangeCalendarSelector(selectRangeDays);
      return <Text testID="len">{days.cells.length}</Text>;
    };
    const ui = render(
      <RangeDateProvider
        allowSameDay
        minRangeDays={1}
        maxRangeDays={10}
        initialStart={new Date(2024, 4, 10)}
      >
        <Probe>
          <Snapshot />
        </Probe>
      </RangeDateProvider>
    );
    expect(ui.getByTestId('len').props.children).toBe(42);
  });
});

// -- Multiple-mode provider -------------------------------------------------

describe('MultipleDateProvider', () => {
  it('exposes selectors + actions for multi-day selection', () => {
    const onChange = jest.fn();
    const Probe = () => {
      const days = useMultipleCalendarSelector(selectMultipleDays);
      const months = useMultipleCalendarSelector(selectMultipleMonths);
      const years = useMultipleCalendarSelector(selectMultipleYears);
      const canConfirm = useMultipleCalendarSelector(selectMultipleCanConfirm);
      const actions = useMultipleCalendarActions();
      return (
        <View>
          <Text testID="cells">{days.cells.length}</Text>
          <Text testID="m">{months.activeMonth}</Text>
          <Text testID="y">{years.activeYear}</Text>
          <Text testID="canConfirm">{canConfirm ? 'yes' : 'no'}</Text>
          <Pressable
            testID="add"
            onPress={() => actions.selectDate(new Date(2024, 4, 10))}
          />
          <Pressable testID="clear" onPress={() => actions.clear()} />
        </View>
      );
    };
    const ui = render(
      <MultipleDateProvider
        initialDates={[new Date(2024, 4, 5)]}
        maxSelected={3}
        onChange={onChange}
      >
        <Probe />
      </MultipleDateProvider>
    );
    expect(ui.getByTestId('canConfirm').props.children).toBe('yes');
    fireEvent.press(ui.getByTestId('add'));
    expect(onChange).toHaveBeenCalled();
    fireEvent.press(ui.getByTestId('clear'));
    expect(ui.getByTestId('canConfirm').props.children).toBe('no');
  });

  it('throws when hooks are used outside the provider', () => {
    const Bad = () => {
      useMultipleCalendarSelector(selectMultipleDays);
      return null;
    };
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Bad />)).toThrow(/MultipleDateProvider/);
    error.mockRestore();
  });
});

// -- Shared provider config (covers providerShared.ts edge branches) --------

describe('useSharedProviderConfig() — provider props plumbing', () => {
  it('forwards explicit disabledDates / disabledRanges into the store', () => {
    const Probe = () => {
      const d = useSingleCalendarSelector((snap) => snap.disabledDates);
      const r = useSingleCalendarSelector((snap) => snap.disabledRanges);
      return <Text testID="lens">{`${d?.length ?? 0}/${r?.length ?? 0}`}</Text>;
    };
    const ui = render(
      <SingleDateProvider
        disabledDates={[new Date(2024, 4, 10)]}
        disabledRanges={[
          { start: new Date(2024, 4, 12), end: new Date(2024, 4, 14) },
        ]}
      >
        <Probe />
      </SingleDateProvider>
    );
    expect(ui.getByTestId('lens').props.children).toBe('1/1');
  });
});
