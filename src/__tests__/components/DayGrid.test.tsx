import React from 'react';
import { Text, View } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { DayCell, DayGrid } from '../../components/DayGrid';
import { Root } from '../../components/Root';
import { useCalendarStore, useCalendarSystemSwitcher } from '../../context';
import type { CalendarStore } from '../../store';
import {
  createGregorianSystem,
  gregorianSystem,
} from '../../systems/gregorian';
import type {
  CalendarComponents,
  CalendarDateValue,
  CalendarSystem,
  DayCellInfo,
  MonthCaptionProps,
  WeekdayHeaderProps,
} from '../../types';
import {
  getMockFlashListProps,
  getMockFlashListScrollCalls,
  resetMockFlashList,
} from '../__mocks__/flash-list';

// Stand in for the optional `@shopify/flash-list` peer dep — see the mock
// file for the rationale.
jest.mock('@shopify/flash-list', () => require('../__mocks__/flash-list'));

const PAGE_WIDTH = 350;

// Drives the SwipeableMonthList from `pageWidth=0` to a measured width
// so the inner FlashList mounts.
const fireSwipeableLayout = (
  target: ReturnType<typeof render>['getByTestId']
) =>
  fireEvent(target('cal.calendar.swipeable'), 'layout', {
    nativeEvent: {
      layout: { width: PAGE_WIDTH, height: 240, x: 0, y: 0 },
    },
  });

// Simulates a swipe landing on the month at `targetIndex` in the
// FlashList's data window. Mirrors what a real FlashList would emit
// once the new page crosses the `itemVisiblePercentThreshold`.
const fireSwipeToItem = (item: CalendarDateValue, index: number) => {
  const { onViewableItemsChanged } = getMockFlashListProps();
  if (typeof onViewableItemsChanged !== 'function') {
    throw new Error(
      'fireSwipeToItem(): expected onViewableItemsChanged to be wired'
    );
  }
  act(() => {
    onViewableItemsChanged({
      viewableItems: [
        {
          item,
          key: `${index}`,
          index,
          isViewable: true,
          containerId: 0,
        },
      ],
      changed: [],
    });
  });
};

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

  // Regression: tapping a day inside the displayed month must not
  // invalidate Layer 1. `selectDate` updates `displayed` to the tapped
  // date, so MonthGrid receives a fresh `month` object reference even
  // though the calendar month is identical. The cell skeleton cache
  // keys on (year, month) primitives so the 42 underlying `date` refs
  // are reused across taps — which is what lets `dayCellPropsEqual`
  // skip every cell whose visual state didn't change.
  it('preserves Layer 1 cell date refs across same-month selectDate calls', () => {
    let storeRef: CalendarStore | null = null;
    const StoreCapture: React.FC = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const renders: CalendarDateValue[][] = [];
    let current: CalendarDateValue[] = [];
    renders.push(current);
    const renderDay = (info: DayCellInfo) => {
      current.push(info.date);
      return <Text key={String(current.length)}>x</Text>;
    };

    render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <StoreCapture />
        <DayGrid renderDay={renderDay} />
      </Root>
    );

    const before = renders[0]!.slice();
    expect(before).toHaveLength(42);

    current = [];
    renders.push(current);
    act(() => {
      storeRef!.selectDate(
        gregorianSystem.fromNativeDate(new Date(2024, 4, 20))
      );
    });

    const after = renders[1]!;
    expect(after).toHaveLength(42);
    for (let i = 0; i < before.length; i += 1) {
      expect(after[i]).toBe(before[i]);
    }
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

  // Months SwipeableMonthList builds around `displayed`. Kept in sync
  // with `WINDOW_RADIUS` in `DayGrid.tsx` — increase here if the
  // production constant grows.
  const WINDOW_RADIUS = 12;
  const ACTIVE_INDEX = WINDOW_RADIUS;
  const WINDOW_SIZE = WINDOW_RADIUS * 2 + 1;

  beforeEach(() => {
    resetMockFlashList();
  });

  it('does not mount the FlashList until the wrapper is laid out', () => {
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
    // The list is conditional on pageWidth > 0 — before the layout
    // event fires, only the outer wrapper exists.
    expect(queryByTestId('cal.calendar.swipeable.list')).toBeNull();
  });

  it('mounts the FlashList once the wrapper is laid out', () => {
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

  it('renders only the active month — neighbouring months sit in data but stay unmounted', () => {
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
    // FlashList virtualises everything outside `drawDistance`, so even
    // though `data` carries 25 months only the active one mints day
    // cells (6 rows × 7 cols = 42).
    expect(utils.getAllByRole('button')).toHaveLength(42);
  });

  it('hands FlashList a 25-month window centred on the displayed month', () => {
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
    const props = getMockFlashListProps();
    expect(props.data).toHaveLength(WINDOW_SIZE);
    expect(props.initialScrollIndex).toBe(ACTIVE_INDEX);
    // Active slot is the requested initial date (May 2024).
    expect((props.data as CalendarDateValue[])[ACTIVE_INDEX]).toEqual(
      expect.objectContaining({ y: 2024, m: 4 })
    );
    // Neighbours are the prev / next month (April / June 2024).
    expect((props.data as CalendarDateValue[])[ACTIVE_INDEX - 1]).toEqual(
      expect.objectContaining({ y: 2024, m: 3 })
    );
    expect((props.data as CalendarDateValue[])[ACTIVE_INDEX + 1]).toEqual(
      expect.objectContaining({ y: 2024, m: 5 })
    );
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

  it('advances the displayed month when the next page crosses the viewability threshold', () => {
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
    const data = getMockFlashListProps().data as CalendarDateValue[];
    fireSwipeToItem(data[ACTIVE_INDEX + 1]!, ACTIVE_INDEX + 1);
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2024, m: 5 })
    );
  });

  it('steps backward when the prev page becomes viewable', () => {
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
    const data = getMockFlashListProps().data as CalendarDateValue[];
    fireSwipeToItem(data[ACTIVE_INDEX - 1]!, ACTIVE_INDEX - 1);
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2024, m: 3 })
    );
  });

  it('is a no-op when the viewable item is still the current month', () => {
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
    const data = getMockFlashListProps().data as CalendarDateValue[];
    // Same month re-reported — falls into the `delta === 0` branch and
    // doesn't dispatch into the store.
    fireSwipeToItem(data[ACTIVE_INDEX]!, ACTIVE_INDEX);
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2024, m: 4 })
    );
  });

  it('ignores empty viewability events (no isViewable item)', () => {
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
    const { onViewableItemsChanged } = getMockFlashListProps();
    act(() => {
      (onViewableItemsChanged as (info: unknown) => void)({
        viewableItems: [],
        changed: [],
      });
    });
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2024, m: 4 })
    );
  });

  it('handles consecutive viewability events without losing track of displayed', () => {
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
    const data = getMockFlashListProps().data as CalendarDateValue[];
    fireSwipeToItem(data[ACTIVE_INDEX + 1]!, ACTIVE_INDEX + 1);
    fireSwipeToItem(data[ACTIVE_INDEX + 2]!, ACTIVE_INDEX + 2);
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2024, m: 6 })
    );
  });

  it('scrolls the list when external navigation moves displayed within the window', () => {
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
    const baselineCalls = getMockFlashListScrollCalls().length;
    act(() => {
      storeRef!.changeMonth(1);
    });
    const calls = getMockFlashListScrollCalls();
    expect(calls.length).toBeGreaterThan(baselineCalls);
    expect(calls[calls.length - 1]).toEqual({
      index: ACTIVE_INDEX + 1,
      animated: false,
    });
    // Window stayed put; only the active slot moved.
    expect(getMockFlashListProps().data).toHaveLength(WINDOW_SIZE);
  });

  // Regression: tapping a date inside the displayed month must NOT
  // rebuild the FlashList data window. `selectDate` updates `displayed`
  // to the tapped date, so the reconciliation effect previously called
  // `system.isSame` (which compares year+month+day) and missed the
  // existing entry — triggering a full 25-month rebuild on every tap.
  // Reconciling by year+month keeps the data array identity stable,
  // which in turn keeps every mounted MonthGrid's `month` prop stable
  // and avoids re-rendering the entire grid.
  it('keeps the data window identity stable on a same-month tap', () => {
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
    const dataBefore = getMockFlashListProps().data as CalendarDateValue[];
    const activeBefore = dataBefore[ACTIVE_INDEX];

    act(() => {
      storeRef!.selectDate(
        gregorianSystem.fromNativeDate(new Date(2024, 4, 20))
      );
    });

    const dataAfter = getMockFlashListProps().data as CalendarDateValue[];
    expect(dataAfter).toBe(dataBefore);
    expect(dataAfter[ACTIVE_INDEX]).toBe(activeBefore);
  });

  it('rebuilds the window when external navigation jumps outside it', () => {
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
    // 24 months out → outside of the ±12 window.
    act(() => {
      storeRef!.changeMonth(24);
    });
    const data = getMockFlashListProps().data as CalendarDateValue[];
    expect(data).toHaveLength(WINDOW_SIZE);
    // After re-centring the active month sits at the middle slot again.
    expect(data[ACTIVE_INDEX]).toEqual(
      expect.objectContaining({ y: 2026, m: 4 })
    );
  });

  it('grows the window backwards when the user reaches the start', () => {
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
    const initialFirst = (
      getMockFlashListProps().data as CalendarDateValue[]
    )[0];
    expect(initialFirst).toBeDefined();
    act(() => {
      const props = getMockFlashListProps();
      (props.onStartReached as (info: unknown) => void)({
        distanceFromStart: 0,
      });
    });
    const grown = getMockFlashListProps().data as CalendarDateValue[];
    expect(grown.length).toBeGreaterThan(WINDOW_SIZE);
    // Old first month now sits later in the array.
    const isSame = gregorianSystem.isSame as (
      a: CalendarDateValue,
      b: CalendarDateValue
    ) => boolean;
    const idxOfPrev = grown.findIndex((m) => isSame(m, initialFirst!));
    expect(idxOfPrev).toBeGreaterThan(0);
  });

  it('grows the window forwards when the user reaches the end', () => {
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
    const initialLast = (() => {
      const data = getMockFlashListProps().data as CalendarDateValue[];
      return data[data.length - 1];
    })();
    act(() => {
      const props = getMockFlashListProps();
      (props.onEndReached as (info: unknown) => void)({
        distanceFromEnd: 0,
      });
    });
    const grown = getMockFlashListProps().data as CalendarDateValue[];
    expect(grown.length).toBeGreaterThan(WINDOW_SIZE);
    // The previous tail is no longer at the end — fresh months were
    // appended after it.
    expect(grown[grown.length - 1]).not.toEqual(initialLast);
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

  it('skips the setPageWidth state update when the layout width is unchanged', () => {
    // Two layout events at the same width → the second one falls into
    // the `w === pageWidth` branch and short-circuits without re-
    // entering React's state pipeline.
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
    fireSwipeableLayout(utils.getByTestId);
    expect(utils.queryByTestId('cal.calendar.swipeable.list')).toBeTruthy();
  });

  it('omits the testID prefix on the wrapper and list when no testID is configured', () => {
    const utils = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <DayGrid swipeable />
      </Root>
    );
    expect(utils.queryByTestId('calendar.swipeable')).toBeNull();
    expect(utils.queryByTestId('calendar.swipeable.list')).toBeNull();
    // Drive the layout so the FlashList mounts and exercises the
    // `testID ? ... : undefined` ternary on its own testID prop.
    // Without a testID prefix we can't address the wrapper by ID, so
    // we reach for it by the unique `width: '100%'` style our
    // SwipeableMonthList sets on its outer View.
    const swipeableHosts = utils.UNSAFE_root.findAll((n) => {
      const style = (n.props as { style?: { width?: string | number } } | null)
        ?.style;
      return style?.width === '100%';
    });
    expect(swipeableHosts.length).toBeGreaterThan(0);
    fireEvent(swipeableHosts[0]!, 'layout', {
      nativeEvent: { layout: { width: PAGE_WIDTH, height: 240, x: 0, y: 0 } },
    });
    // The FlashList mounted; its testID ternary fell into the
    // `undefined` arm (not a `cal.calendar.swipeable.list` ID).
    expect(getMockFlashListProps().testID).toBeUndefined();
  });

  it('rebuilds the window when the active calendar system swaps', () => {
    // A second system whose `id` differs from gregorian — that's the
    // signal SwipeableMonthList watches for to wipe the data window.
    const second = createGregorianSystem({ label: 'Alt' });
    Object.defineProperty(second, 'id', { value: 'alt-gregorian' });

    let switcherRef: ReturnType<typeof useCalendarSystemSwitcher> | null = null;
    const SwitcherCapture: React.FC = () => {
      switcherRef = useCalendarSystemSwitcher();
      return null;
    };

    const utils = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem, second as CalendarSystem]}
        testID="cal"
      >
        <SwitcherCapture />
        <DayGrid swipeable />
      </Root>
    );
    fireSwipeableLayout(utils.getByTestId);
    const baselineFirst = (
      getMockFlashListProps().data as CalendarDateValue[]
    )[0];

    act(() => {
      switcherRef!.setActive('alt-gregorian');
    });

    const data = getMockFlashListProps().data as CalendarDateValue[];
    expect(data).toHaveLength(WINDOW_SIZE);
    // Window was rebuilt — the first slot is a brand-new month value
    // even though the calendar dates around it line up arithmetically.
    expect(data[0]).not.toBe(baselineFirst);
  });

  it('rebuilds the window on system swap under React.StrictMode', () => {
    // Regression for the "month = 0" production crash. A previous fix
    // tracked the last-seen system id with `useRef`. Refs survive
    // StrictMode's double-invocation, which (combined with concurrent
    // re-renders in React 19) means the second invocation can see the
    // ref already updated, skip the rebuild, and feed the FlashList
    // stale-system months. Tracking the id with `useState` instead is
    // the canonical "storing information from previous renders" idiom
    // (https://react.dev/reference/react/useState#storing-information-
    // from-previous-renders) and is robust against double-invocation.
    const second = createGregorianSystem({ label: 'Alt' });
    Object.defineProperty(second, 'id', { value: 'alt-gregorian' });

    let switcherRef: ReturnType<typeof useCalendarSystemSwitcher> | null = null;
    const SwitcherCapture: React.FC = () => {
      switcherRef = useCalendarSystemSwitcher();
      return null;
    };

    const utils = render(
      <React.StrictMode>
        <Root
          initialDate={new Date(2024, 4, 15)}
          systems={[gregorianSystem, second as CalendarSystem]}
          testID="cal"
        >
          <SwitcherCapture />
          <DayGrid swipeable />
        </Root>
      </React.StrictMode>
    );
    fireSwipeableLayout(utils.getByTestId);
    const baselineFirst = (
      getMockFlashListProps().data as CalendarDateValue[]
    )[0];

    expect(() => {
      act(() => {
        switcherRef!.setActive('alt-gregorian');
      });
    }).not.toThrow();

    const data = getMockFlashListProps().data as CalendarDateValue[];
    expect(data).toHaveLength(WINDOW_SIZE);
    expect(data[0]).not.toBe(baselineFirst);
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
    modifiers: {},
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

// ---------------------------------------------------------------------------
// Multi-select mode + dynamic disabled predicate
// ---------------------------------------------------------------------------

describe('<Calendar.DayGrid mode="multiple" />', () => {
  it('toggles selectedDates on each tap', () => {
    let storeRef: CalendarStore | null = null;
    const StoreCapture: React.FC = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId } = render(
      <Root
        initialDates={[new Date(2024, 4, 15)]}
        mode="multiple"
        systems={[gregorianSystem]}
        testID="cal"
      >
        <StoreCapture />
        <DayGrid />
      </Root>
    );
    expect(storeRef!.getSnapshot().selectedDates).toHaveLength(1);
    const day1 = getByTestId('cal.calendar.day.2024-05-01');
    const day3 = getByTestId('cal.calendar.day.2024-05-03');
    act(() => {
      fireEvent.press(day1);
      fireEvent.press(day3);
    });
    expect(storeRef!.getSnapshot().selectedDates).toHaveLength(3);
    act(() => fireEvent.press(day1));
    expect(storeRef!.getSnapshot().selectedDates).toHaveLength(2);
  });
});

describe('<Calendar.Root disabled />', () => {
  it('marks predicate-disabled cells as accessibilityState.disabled', () => {
    const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
    const { getByTestId } = render(
      <Root
        disabled={isWeekend}
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid />
      </Root>
    );
    // 2024-05-04 is a Saturday.
    const sat = getByTestId('cal.calendar.day.2024-05-04');
    expect(sat.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true })
    );
    const tap = jest.fn();
    fireEvent.press(sat, { onPress: tap });
    expect(tap).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// showOutsideDays / fixedWeeks
// ---------------------------------------------------------------------------

describe('<Calendar.DayGrid /> showOutsideDays / fixedWeeks', () => {
  it('does not press through outside-month placeholder cells when showOutsideDays={false}', () => {
    const { getAllByRole, queryByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        showOutsideDays={false}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid />
      </Root>
    );
    // May 2024 starts on a Wednesday → 3 leading outside cells. April 30 cell
    // becomes a placeholder and is no longer pressable.
    expect(queryByTestId('cal.calendar.day.2024-04-30')).toBeNull();
    // The current-month + trailing-outside cells still render as buttons.
    expect(getAllByRole('button').length).toBeLessThan(42);
  });

  it('collapses trailing rows when fixedWeeks={false} on a 4-row month', () => {
    // Feb 2026 fits in exactly 4 weeks (Sunday-first, no leading offset,
    // 28 days, no trailing outside cells in row 5+).
    const { getAllByRole } = render(
      <Root
        fixedWeeks={false}
        initialDate={new Date(2026, 1, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid />
      </Root>
    );
    // 4 rows × 7 cols = 28 cells.
    expect(getAllByRole('button')).toHaveLength(28);
  });
});

// ---------------------------------------------------------------------------
// showWeekNumbers
// ---------------------------------------------------------------------------

describe('<Calendar.DayGrid showWeekNumbers />', () => {
  it('renders 6 week numbers for May 2024 (ISO weeks 18-23)', () => {
    const { getAllByText } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid showWeekNumbers />
      </Root>
    );
    // Each visible week number "18", "19", … collides with a day cell
    // labelled the same number, so we assert against the second match
    // (the week-number column comes first in tree order, the day grid
    // is a sibling later) — confirming both rows are present.
    expect(getAllByText('18').length).toBeGreaterThanOrEqual(2);
    expect(getAllByText('20').length).toBeGreaterThanOrEqual(2);
    expect(getAllByText('22').length).toBeGreaterThanOrEqual(2);
  });

  it('falls back to the ISO week derivation when the system has no weekNumber()', () => {
    // Build a custom system without `weekNumber` so DayGrid's
    // `computeWeekNumber` takes the `isoWeekNumber(toNativeDate(date))`
    // branch.
    const sysNoWeek = createGregorianSystem();
    delete (sysNoWeek as { weekNumber?: unknown }).weekNumber;
    const { getAllByText } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[sysNoWeek]}
        testID="cal"
      >
        <DayGrid showWeekNumbers />
      </Root>
    );
    expect(getAllByText('18').length).toBeGreaterThanOrEqual(2);
  });

  it('threads renderDay / SlotDayCell / showOutsideDays through the week-number row layout', () => {
    // The `showWeekNumbers` branch lays out each row by hand (so it can
    // prepend the week-number column), which means it has its own copy
    // of the renderDay / SlotDayCell / outside-day placeholder code.
    // Cover all three in one render.
    const slotTaps: string[] = [];
    const SlotDayCell: NonNullable<CalendarComponents['DayCell']> = ({
      info,
    }) => (
      <View testID={`wn-slot-${info.label}`}>
        <Text>{info.label}</Text>
      </View>
    );
    const renderDay = (info: DayCellInfo) =>
      info.label === '15' ? (
        <View key={info.label} testID={`wn-render-${info.label}`}>
          <Text>{info.label}</Text>
        </View>
      ) : null;

    // First render exercises the renderDay branch in the WN row.
    const r = render(
      <Root
        components={{ DayCell: SlotDayCell }}
        initialDate={new Date(2024, 4, 15)}
        showOutsideDays={false}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid renderDay={renderDay} showWeekNumbers />
      </Root>
    );
    // renderDay returned a node for "15"; outside-month cells became
    // placeholders so April-30 / May-1 etc. aren't pressable; SlotDayCell
    // would have been used otherwise — but renderDay wins when both are
    // present, so the slot path is exercised in a second render below.
    expect(r.queryByTestId('wn-render-15')).not.toBeNull();

    r.unmount();
    slotTaps.push('reset');

    // Second render drops renderDay so SlotDayCell takes over inside the
    // WN row.
    const r2 = render(
      <Root
        components={{ DayCell: SlotDayCell }}
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid showWeekNumbers />
      </Root>
    );
    expect(r2.queryByTestId('wn-slot-15')).not.toBeNull();
  });

  it('honours a custom WeekNumberCell slot', () => {
    const WeekNumberCell: NonNullable<CalendarComponents['WeekNumberCell']> = ({
      weekNumber,
    }) => (
      <View testID={`week-${weekNumber}`}>
        <Text>W{weekNumber}</Text>
      </View>
    );
    const { queryByTestId, queryByText } = render(
      <Root
        components={{ WeekNumberCell }}
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid showWeekNumbers />
      </Root>
    );
    expect(queryByTestId('week-18')).not.toBeNull();
    expect(queryByText('W18')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// numberOfMonths
// ---------------------------------------------------------------------------

describe('<Calendar.DayGrid numberOfMonths />', () => {
  it('renders the configured number of months side-by-side', () => {
    const captions: string[] = [];
    const MonthCaption: NonNullable<CalendarComponents['MonthCaption']> = (
      props: MonthCaptionProps
    ) => {
      captions.push(props.label);
      return (
        <View>
          <Text>{props.label}</Text>
        </View>
      );
    };
    render(
      <Root
        components={{ MonthCaption }}
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid numberOfMonths={2} />
      </Root>
    );
    expect(captions).toEqual(['May 2024', 'June 2024']);
  });

  it('warns once when swipeable is combined with numberOfMonths > 1 in dev', async () => {
    const typedGlobal = globalThis as typeof globalThis & { __DEV__?: boolean };
    const prev = typedGlobal.__DEV__;
    typedGlobal.__DEV__ = true;
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      render(
        <Root
          initialDate={new Date(2024, 4, 15)}
          systems={[gregorianSystem]}
          testID="cal"
        >
          <DayGrid numberOfMonths={2} swipeable />
        </Root>
      );
      await waitFor(() => {
        expect(spy).toHaveBeenCalledWith(
          expect.stringMatching(/ignored while numberOfMonths > 1/)
        );
      });
    } finally {
      typedGlobal.__DEV__ = prev;
      spy.mockRestore();
    }
  });

  it('renders 84 day buttons for numberOfMonths={2}', () => {
    const { getAllByRole } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid numberOfMonths={2} />
      </Root>
    );
    expect(getAllByRole('button')).toHaveLength(84);
  });

  it('expands each month panel to 8 columns when showWeekNumbers + numberOfMonths combine', () => {
    // The multi-month wrapper widens each panel by one cell so the
    // week-number gutter has room. This pokes the `? 8 : 7` branch of
    // the `width: theme.cellSize * (showWeekNumbers ? 8 : 7)` rule.
    const { getAllByText } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid numberOfMonths={2} showWeekNumbers />
      </Root>
    );
    // May 2024's first ISO week is 18, June 2024's first is 22 — both
    // panels render their gutter, confirming the wider layout took
    // effect across both months.
    expect(getAllByText('18').length).toBeGreaterThanOrEqual(2);
    expect(getAllByText('22').length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Modifiers
// ---------------------------------------------------------------------------

describe('<Calendar.Root modifiers />', () => {
  it('exposes matched modifier flags on DayCellInfo', () => {
    const flags: Record<string, Record<string, boolean>> = {};
    render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        modifiers={{
          booked: [new Date(2024, 4, 10), new Date(2024, 4, 11)],
          weekend: (d) => d.getDay() === 0 || d.getDay() === 6,
        }}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid
          renderDay={(info) => {
            flags[info.label] = info.modifiers as Record<string, boolean>;
            return null;
          }}
        />
      </Root>
    );
    expect(flags['10']).toEqual(expect.objectContaining({ booked: true }));
    expect(flags['11']).toEqual(
      expect.objectContaining({ booked: true, weekend: true })
    );
    // Non-matched cells get an empty object (key just isn't present).
    expect(flags['15']?.booked).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Component slots
// ---------------------------------------------------------------------------

describe('<Calendar.Root components />', () => {
  it('replaces the entire WeekdayHeader when components.WeekdayHeader is set', () => {
    const WeekdayHeader: NonNullable<CalendarComponents['WeekdayHeader']> = ({
      labels,
    }: WeekdayHeaderProps) => (
      <View testID="custom-header">
        <Text>{labels.join('|')}</Text>
      </View>
    );
    const { getByTestId } = render(
      <Root
        components={{ WeekdayHeader }}
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid />
      </Root>
    );
    expect(getByTestId('custom-header')).toBeTruthy();
  });

  it('replaces only individual weekday cells when components.WeekdayCell is set', () => {
    const WeekdayCell: NonNullable<CalendarComponents['WeekdayCell']> = ({
      label,
      index,
    }) => (
      <View testID={`weekday-${index}`}>
        <Text>{label.toUpperCase()}</Text>
      </View>
    );
    const { getByTestId } = render(
      <Root
        components={{ WeekdayCell }}
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <DayGrid />
      </Root>
    );
    expect(getByTestId('weekday-0')).toBeTruthy();
    expect(getByTestId('weekday-6')).toBeTruthy();
  });

  it('uses components.DayCell when no renderDay is passed to DayGrid', () => {
    const taps: string[] = [];
    const DayCellSlot: NonNullable<CalendarComponents['DayCell']> = ({
      info,
      onSelect,
    }) => (
      <View
        accessibilityRole="button"
        testID={`slot-${info.label}`}
        onTouchEnd={() => onSelect(info.date)}
      >
        <Text>{info.label}</Text>
      </View>
    );
    let storeRef: CalendarStore | null = null;
    const StoreCapture: React.FC = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId } = render(
      <Root
        components={{ DayCell: DayCellSlot }}
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <StoreCapture />
        <DayGrid />
      </Root>
    );
    fireEvent(getByTestId('slot-15'), 'touchEnd');
    taps.push('15');
    expect(taps).toEqual(['15']);
    // The slot is wired to the same selectDate path.
    expect(storeRef!.getSnapshot().selectedDate).toBeDefined();
  });
});
