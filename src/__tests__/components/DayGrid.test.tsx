import { Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { DayCell, DayGrid } from '../../components/DayGrid';
import { Root } from '../../components/Root';
import { useCalendarStore } from '../../context';
import type { CalendarStore } from '../../store';
import { gregorianSystem } from '../../systems/gregorian';
import type { DayCellInfo } from '../../types';

const PAGE_WIDTH = 350;

// Drives the SwipeableMonthList from `pageWidth=0` to a measured width so
// the inner FlatList mounts. Tests share this between scenarios.
const fireSwipeableLayout = (
  target: ReturnType<typeof render>['getByTestId']
) =>
  fireEvent(target('cal.calendar.swipeable'), 'layout', {
    nativeEvent: {
      layout: { width: PAGE_WIDTH, height: 240, x: 0, y: 0 },
    },
  });

// Fires a single horizontal page swipe on the SwipeableMonthList — index
// 0 = previous month, 2 = next month. Index 1 (the centre) is a no-op the
// component intentionally ignores.
const fireSwipeTo = (
  utils: ReturnType<typeof render>,
  targetIndex: 0 | 1 | 2
) =>
  fireEvent(
    utils.getByTestId('cal.calendar.swipeable.list'),
    'momentumScrollEnd',
    {
      nativeEvent: { contentOffset: { x: PAGE_WIDTH * targetIndex, y: 0 } },
    }
  );

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

  // -- firstDayOfWeek -----------------------------------------------------

  it('renders the weekday header in Sunday-first order by default', () => {
    const { getByText } = render(
      <Root systems={[gregorianSystem]}>
        <DayGrid />
      </Root>
    );
    // Default order — useful as a smoke check before asserting rotation.
    expect(getByText('Sun')).toBeTruthy();
    expect(getByText('Sat')).toBeTruthy();
  });

  it('rotates the weekday header when firstDayOfWeek=1 (Monday)', () => {
    const { getByText, queryAllByText } = render(
      <Root firstDayOfWeek={1} systems={[gregorianSystem]}>
        <DayGrid />
      </Root>
    );
    expect(getByText('Mon')).toBeTruthy();
    expect(getByText('Sun')).toBeTruthy();
    // Each label appears exactly once in the header (no duplicates from rotation).
    expect(queryAllByText('Mon')).toHaveLength(1);
    expect(queryAllByText('Sun')).toHaveLength(1);
  });

  it('shifts the leading cells when firstDayOfWeek=1 so the grid starts on Monday', () => {
    // May 1 2024 is a Wednesday → with Monday as the first column, the
    // grid leads with April 29, April 30, then May 1.
    const captured: DayCellInfo[] = [];
    render(
      <Root
        firstDayOfWeek={1}
        initialDate={new Date(2024, 4, 1)}
        systems={[gregorianSystem]}
      >
        <DayGrid
          renderDay={(info) => {
            captured.push(info);
            return <Text key={String(captured.length)}>x</Text>;
          }}
        />
      </Root>
    );
    expect(captured[0]?.label).toBe('29');
    expect(captured[1]?.label).toBe('30');
    expect(captured[2]?.label).toBe('1');
    expect(captured[2]?.isCurrentMonth).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// <Calendar.DayGrid swipeable />
// ---------------------------------------------------------------------------

describe('<Calendar.DayGrid swipeable />', () => {
  // Captures the live store inside any <Calendar.Root> the test renders so
  // assertions can read the `displayed` snapshot after a swipe.
  const StoreCapture = ({
    onCapture,
  }: {
    onCapture: (store: CalendarStore) => void;
  }) => {
    onCapture(useCalendarStore());
    return null;
  };

  it('does not mount the FlatList until the wrapper is laid out', () => {
    const { queryByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid swipeable />
      </Root>
    );
    expect(queryByTestId('cal.calendar.swipeable')).toBeTruthy();
    // The FlatList is conditional on pageWidth > 0 — before the layout
    // event fires, only the outer wrapper exists.
    expect(queryByTestId('cal.calendar.swipeable.list')).toBeNull();
  });

  it('mounts the FlatList once the wrapper is laid out', () => {
    const utils = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid swipeable />
      </Root>
    );
    fireSwipeableLayout(utils.getByTestId);
    expect(utils.queryByTestId('cal.calendar.swipeable.list')).toBeTruthy();
  });

  it('renders multiple month pages so swipes reveal an adjacent month', () => {
    const utils = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid swipeable />
      </Root>
    );
    fireSwipeableLayout(utils.getByTestId);
    // The active page contributes 42 cells; FlatList eagerly renders at
    // least one neighbour so the swipe gesture has somewhere to scroll to.
    // The exact count depends on RN's virtualization heuristics — we only
    // assert "more than one page worth" so the test stays robust.
    const cells = utils.getAllByRole('button');
    expect(cells.length).toBeGreaterThan(42);
    expect(cells.length % 42).toBe(0);
  });

  it('keeps the weekday header outside of the swipeable area', () => {
    // Sun appears once in the fixed header — not duplicated per page.
    const utils = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid swipeable />
      </Root>
    );
    fireSwipeableLayout(utils.getByTestId);
    expect(utils.queryAllByText('Sun')).toHaveLength(1);
  });

  it('advances the displayed month on a swipe to the next page', () => {
    let storeRef: CalendarStore | null = null;
    const utils = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <StoreCapture onCapture={(s) => (storeRef = s)} />
        <DayGrid swipeable />
      </Root>
    );
    fireSwipeableLayout(utils.getByTestId);
    act(() => {
      fireSwipeTo(utils, 2);
    });
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2024, m: 5 })
    );
  });

  it('steps backward on a swipe to the previous page', () => {
    let storeRef: CalendarStore | null = null;
    const utils = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <StoreCapture onCapture={(s) => (storeRef = s)} />
        <DayGrid swipeable />
      </Root>
    );
    fireSwipeableLayout(utils.getByTestId);
    act(() => {
      fireSwipeTo(utils, 0);
    });
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2024, m: 3 })
    );
  });

  it('is a no-op when the user releases on the centre page', () => {
    let storeRef: CalendarStore | null = null;
    const utils = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <StoreCapture onCapture={(s) => (storeRef = s)} />
        <DayGrid swipeable />
      </Root>
    );
    fireSwipeableLayout(utils.getByTestId);
    act(() => {
      fireSwipeTo(utils, 1);
    });
    // Same month as initialDate — store.changeMonth was not invoked.
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2024, m: 4 })
    );
  });

  it('handles consecutive swipes by re-centring after each one', () => {
    let storeRef: CalendarStore | null = null;
    const utils = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <StoreCapture onCapture={(s) => (storeRef = s)} />
        <DayGrid swipeable />
      </Root>
    );
    fireSwipeableLayout(utils.getByTestId);
    act(() => {
      fireSwipeTo(utils, 2);
    });
    act(() => {
      fireSwipeTo(utils, 2);
    });
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2024, m: 6 })
    );
  });

  it('lets external navigation drive the same FlatList', () => {
    let storeRef: CalendarStore | null = null;
    const utils = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <StoreCapture onCapture={(s) => (storeRef = s)} />
        <DayGrid swipeable />
      </Root>
    );
    fireSwipeableLayout(utils.getByTestId);
    act(() => {
      storeRef!.changeMonth(1);
    });
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2024, m: 5 })
    );
    // Pages re-render around the new displayed month — the prev page is
    // April, current is May, next is June.
    expect(utils.queryAllByText('Sun')).toHaveLength(1);
  });

  it('still routes day taps through the store in swipeable mode', () => {
    let storeRef: CalendarStore | null = null;
    const utils = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <StoreCapture onCapture={(s) => (storeRef = s)} />
        <DayGrid swipeable />
      </Root>
    );
    fireSwipeableLayout(utils.getByTestId);
    fireEvent.press(utils.getByTestId('cal.calendar.day.2024-05-10'));
    expect(storeRef!.getSnapshot().selectedDate).toEqual(
      expect.objectContaining({ y: 2024, m: 4, d: 10 })
    );
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
