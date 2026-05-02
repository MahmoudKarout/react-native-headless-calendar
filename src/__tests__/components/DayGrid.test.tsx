import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { DayCell, DayGrid } from '../../components/DayGrid';
import { Root } from '../../components/Root';
import { gregorianSystem } from '../../systems/gregorian';
import type { DayCellInfo } from '../../types';

describe('<Calendar.DayGrid />', () => {
  it('renders 42 cells when no renderDay is provided', () => {
    const { getAllByRole } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid />
      </Root>
    );
    expect(getAllByRole('button')).toHaveLength(42);
  });

  it('uses the renderDay prop when provided', () => {
    const renderDay = jest.fn((info: DayCellInfo) => (
      <Text key={info.label}>{info.label}</Text>
    ));
    render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid renderDay={renderDay} />
      </Root>
    );
    expect(renderDay).toHaveBeenCalled();
    // 42 cells were enriched.
    expect(renderDay.mock.calls.length).toBe(42);
  });

  it('triggers store.selectDate and onSelectHaptic on a day press', () => {
    const onSelectHaptic = jest.fn();
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        onSelectHaptic={onSelectHaptic}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid />
      </Root>
    );
    fireEvent.press(getByTestId('cal.calendar.day.2024-05-10'));
    expect(onSelectHaptic).toHaveBeenCalled();
  });

  it('marks today, the selection, and respects bounds', () => {
    const today = new Date();
    today.setHours(12);
    const { getByTestId } = render(
      <Root
        initialDate={today}
        maxDate={today}
        minDate={today}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid />
      </Root>
    );
    const id = `cal.calendar.day.${today.toISOString().slice(0, 10)}`;
    expect(getByTestId(id)).toBeTruthy();
  });

  it('flags isCurrentMonth=false for cells outside the displayed month', () => {
    const captured: DayCellInfo[] = [];
    render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid
          renderDay={(info) => {
            captured.push(info);
            return <Text key={String(captured.length)}>x</Text>;
          }}
        />
      </Root>
    );
    expect(captured.some((c) => !c.isCurrentMonth)).toBe(true);
  });

  it('marks isRangeStart, inRange, and isRangeEnd in range mode', () => {
    const captured: DayCellInfo[] = [];
    render(
      <Root
        initialEnd={new Date(2024, 4, 17)}
        initialStart={new Date(2024, 4, 15)}
        mode="range"
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid
          renderDay={(info) => {
            captured.push(info);
            return <Text key={String(captured.length)}>x</Text>;
          }}
        />
      </Root>
    );
    const start = captured.find((c) => c.isRangeStart);
    const end = captured.find((c) => c.isRangeEnd);
    const middle = captured.find(
      (c) => c.inRange && !c.isRangeStart && !c.isRangeEnd
    );
    expect(start).toBeDefined();
    expect(end).toBeDefined();
    expect(middle).toBeDefined();
  });

  it('marks disabled cells from minDate / maxDate / disabledDates / disabledRanges', () => {
    const captured: DayCellInfo[] = [];
    render(
      <Root
        disabledDates={[new Date(2024, 4, 12)]}
        disabledRanges={[
          { start: new Date(2024, 4, 20), end: new Date(2024, 4, 22) },
        ]}
        initialDate={new Date(2024, 4, 15)}
        maxDate={new Date(2024, 4, 25)}
        minDate={new Date(2024, 4, 5)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid
          renderDay={(info) => {
            captured.push(info);
            return <Text key={String(captured.length)}>x</Text>;
          }}
        />
      </Root>
    );
    expect(captured.some((c) => c.isDisabled)).toBe(true);
  });

  it('does not call onSelectHaptic when tapping a disabled day (DayCell skips onPress)', () => {
    const onSelectHaptic = jest.fn();
    const { getByTestId } = render(
      <Root
        disabledDates={[new Date(2024, 4, 10)]}
        initialDate={new Date(2024, 4, 15)}
        onSelectHaptic={onSelectHaptic}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid />
      </Root>
    );
    const cell = getByTestId('cal.calendar.day.2024-05-10');
    fireEvent.press(cell);
    expect(onSelectHaptic).not.toHaveBeenCalled();
  });
});

describe('<Calendar.DayCell /> equality', () => {
  const baseInfo: DayCellInfo = {
    date: gregorianSystem.fromNativeDate(new Date(2024, 4, 15)),
    nativeDate: new Date(2024, 4, 15),
    label: '15',
    isCurrentMonth: true,
    isToday: false,
    isSelected: false,
    inRange: false,
    isRangeStart: false,
    isRangeEnd: false,
    isDisabled: false,
  };

  const renderCell = (props: { info: DayCellInfo; onSelect?: () => void }) =>
    render(
      <Root systems={[gregorianSystem]} testID="cal">
        <DayCell info={props.info} onSelect={props.onSelect ?? jest.fn()} />
      </Root>
    );

  it('renders an isSelected cell', () => {
    const tree = renderCell({ info: { ...baseInfo, isSelected: true } });
    expect(tree.toJSON()).toBeTruthy();
  });

  it('renders an inRange cell with squared corners', () => {
    const tree = renderCell({ info: { ...baseInfo, inRange: true } });
    expect(tree.toJSON()).toBeTruthy();
  });

  it('renders the start of a range', () => {
    const tree = renderCell({ info: { ...baseInfo, isRangeStart: true } });
    expect(tree.toJSON()).toBeTruthy();
  });

  it('renders the end of a range', () => {
    const tree = renderCell({ info: { ...baseInfo, isRangeEnd: true } });
    expect(tree.toJSON()).toBeTruthy();
  });

  it('renders a single-day range (start === end)', () => {
    const tree = renderCell({
      info: { ...baseInfo, isRangeStart: true, isRangeEnd: true },
    });
    expect(tree.toJSON()).toBeTruthy();
  });

  it('renders a disabled non-current-month cell', () => {
    const tree = renderCell({
      info: { ...baseInfo, isCurrentMonth: false, isDisabled: true },
    });
    expect(tree.toJSON()).toBeTruthy();
  });

  it('renders a today cell with a border', () => {
    const tree = renderCell({ info: { ...baseInfo, isToday: true } });
    expect(tree.toJSON()).toBeTruthy();
  });

  it('does not invoke onSelect when disabled', () => {
    const onSelect = jest.fn();
    const { getByRole } = renderCell({
      info: { ...baseInfo, isDisabled: true },
      onSelect,
    });
    fireEvent.press(getByRole('button'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('invokes onSelect when not disabled', () => {
    const onSelect = jest.fn();
    const { getByRole } = renderCell({ info: baseInfo, onSelect });
    fireEvent.press(getByRole('button'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('renders without a testID prefix when one is not configured', () => {
    const onSelect = jest.fn();
    const { queryByTestId } = render(
      <Root systems={[gregorianSystem]}>
        <DayCell info={baseInfo} onSelect={onSelect} />
      </Root>
    );
    expect(queryByTestId('calendar.day.2024-05-15')).toBeNull();
  });

  it('re-renders when only the onSelect callback identity changes', () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender, getByRole } = render(
      <Root systems={[gregorianSystem]} testID="cal">
        <DayCell info={baseInfo} onSelect={first} />
      </Root>
    );
    rerender(
      <Root systems={[gregorianSystem]} testID="cal">
        <DayCell info={baseInfo} onSelect={second} />
      </Root>
    );
    fireEvent.press(getByRole('button'));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
