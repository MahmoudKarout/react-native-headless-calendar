/**
 * Infinite vertical month list — iOS Calendar style.
 *
 * One shared <CalendarProvider> wraps a FlashList of months. Each row
 * renders a full 6×7 month grid with the weekday header. Cells outside
 * the displayed month are rendered as invisible placeholders so the
 * column geometry stays a clean 7-wide grid.
 *
 * Selection is driven by `useCalendarDays().selectDate`; per-cell
 * "selected" highlight reads via `useCalendarSelector` so only the cell
 * whose state actually changed re-renders.
 */
import {
  createContext,
  memo,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';

import {
  CalendarProvider,
  buildMonthGrid,
  gregorianSystem,
  useCalendarDays,
  useCalendarSelector,
} from 'react-native-fast-calendar';

import { tokens } from './HooksCalendar';

const MONTHS_BEFORE = 24;
const MONTHS_AFTER = 36;
const FIRST_DAY_OF_WEEK = 0; // Sunday — matches the iOS Calendar default.

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface MonthData {
  /** First-of-month native date — used by the calendar system to build the grid. */
  firstOfMonth: Date;
  /** Year + month index — stable identity within the list. */
  key: string;
}

function buildMonths(): MonthData[] {
  const today = new Date();
  today.setDate(1);
  today.setHours(0, 0, 0, 0);
  const out: MonthData[] = [];
  for (let i = -MONTHS_BEFORE; i <= MONTHS_AFTER; i += 1) {
    const d = new Date(today);
    d.setMonth(d.getMonth() + i);
    out.push({
      firstOfMonth: d,
      key: `${d.getFullYear()}-${d.getMonth()}`,
    });
  }
  return out;
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * Context delivering a *stable* `selectDate` callback to every DayCell.
 *
 * `useCalendarDays()` subscribes to ~14 store slices, so calling it inside
 * `MonthList` would re-render the entire list (and bust every memo) on
 * every selection change. Instead we stash `selectDate` on a ref inside a
 * sibling that returns `null`: that sibling can re-render freely without
 * touching the FlashList tree, and the context value itself never
 * changes identity, so `MonthList` and its rows render exactly once.
 */
const SelectDateContext = createContext<(d: Date) => void>(() => {});

function SelectDateProvider({ children }: { children: ReactNode }) {
  const selectDateRef = useRef<(d: Date) => void>(() => {});
  const stable = useRef((d: Date) => selectDateRef.current(d)).current;
  return (
    <SelectDateContext.Provider value={stable}>
      <SelectDateBinder targetRef={selectDateRef} />
      {children}
    </SelectDateContext.Provider>
  );
}

function SelectDateBinder({
  targetRef,
}: {
  targetRef: React.MutableRefObject<(d: Date) => void>;
}) {
  // This component re-renders on every store change — it's intentionally
  // isolated as a leaf that returns null so its re-renders cost nothing.
  const { selectDate } = useCalendarDays();
  targetRef.current = selectDate;
  return null;
}

function MonthList() {
  const months = useMemo(() => buildMonths(), []);
  const todayIndex = MONTHS_BEFORE;
  const listRef = useRef<FlashListRef<MonthData> | null>(null);

  // Center the list on the current month after mount.
  useEffect(() => {
    const id = setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: todayIndex,
        animated: false,
      });
    }, 0);
    return () => clearTimeout(id);
  }, [todayIndex]);

  return (
    <FlashList
      ref={listRef}
      data={months}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
    />
  );
}

const keyExtractor = (item: MonthData) => item.key;
const renderItem = ({ item }: { item: MonthData }) => (
  <MonthGrid month={item.firstOfMonth} />
);

interface MonthGridProps {
  month: Date;
}

const MonthGrid = memo(function MonthGrid({ month }: MonthGridProps) {
  const monthIndex = month.getMonth();
  const monthLabel = `${MONTH_NAMES[monthIndex]} ${month.getFullYear()}`;

  // buildMonthGrid is a public utility from the library — works against
  // any CalendarSystem and returns ROWS * COLS cells with `isCurrentMonth`
  // flags so we know which slots to render as placeholders.
  const cells = useMemo(() => {
    const grid = buildMonthGrid(
      gregorianSystem,
      gregorianSystem.fromNativeDate(month),
      FIRST_DAY_OF_WEEK
    );
    return grid.map((c) => ({
      nativeDate: gregorianSystem.toNativeDate(c.date),
      day: gregorianSystem.day(c.date),
      isCurrentMonth: c.isCurrentMonth,
    }));
  }, [month]);

  return (
    <View style={styles.month}>
      <Text style={styles.monthLabel}>{monthLabel}</Text>
      <View style={styles.divider} />

      <View style={styles.weekdays}>
        {WEEKDAYS.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label.toUpperCase()}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return <View key={idx} style={styles.dayCell} />;
          }
          return (
            <DayCell
              key={cell.nativeDate.toISOString()}
              date={cell.nativeDate}
              day={cell.day}
            />
          );
        })}
      </View>
    </View>
  );
});

interface DayCellProps {
  date: Date;
  day: number;
}

const DayCell = memo(function DayCell({ date, day }: DayCellProps) {
  const onSelect = use(SelectDateContext);
  // Per-cell granular subscription — only this cell re-renders when
  // selection moves on or off it. Two cells re-render on a tap: the
  // previously selected one (false → false stays, but if it was the
  // selected one, true → false fires) and the newly selected one.
  const isSelected = useCalendarSelector((s) => {
    if (s.mode !== 'single' || !s.selectedDate) return false;
    return isSameDay(s.system.toNativeDate(s.selectedDate), date);
  });
  const isToday = isSameDay(date, new Date());
  const handlePress = useCallback(() => onSelect(date), [onSelect, date]);

  return (
    <Pressable onPress={handlePress} style={styles.dayCell}>
      <View
        style={[
          styles.dayInner,
          isToday && !isSelected && styles.dayToday,
          isSelected && styles.daySelected,
        ]}
      >
        <Text
          style={[
            styles.dayText,
            isToday && !isSelected && styles.dayTextToday,
            isSelected && styles.dayTextSelected,
          ]}
        >
          {day}
        </Text>
      </View>
    </Pressable>
  );
});

export default function VerticalListExample() {
  return (
    <View style={styles.container}>
      <CalendarProvider mode="single">
        <SelectDateProvider>
          <MonthList />
        </SelectDateProvider>
      </CalendarProvider>
    </View>
  );
}

const CELL_SIZE = 44;

const styles = StyleSheet.create({
  container: { backgroundColor: tokens.background, flex: 1 },
  month: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  monthLabel: {
    color: tokens.foreground,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  divider: {
    backgroundColor: tokens.border,
    height: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  weekdays: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekday: {
    color: tokens.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textAlign: 'center',
    width: CELL_SIZE,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    alignItems: 'center',
    height: CELL_SIZE,
    justifyContent: 'center',
    width: CELL_SIZE,
  },
  dayInner: {
    alignItems: 'center',
    borderRadius: CELL_SIZE / 2,
    height: CELL_SIZE - 8,
    justifyContent: 'center',
    width: CELL_SIZE - 8,
  },
  dayToday: {
    backgroundColor: tokens.muted,
  },
  daySelected: {
    backgroundColor: tokens.foreground,
  },
  dayText: {
    color: tokens.foreground,
    fontSize: 16,
    fontWeight: '500',
  },
  dayTextToday: {
    fontWeight: '700',
  },
  dayTextSelected: {
    color: tokens.background,
    fontWeight: '700',
  },
});
