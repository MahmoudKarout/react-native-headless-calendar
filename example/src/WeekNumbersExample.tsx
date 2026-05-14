/**
 * Week numbers — derive ISO 8601 week numbers per row from the
 * `cells` array exposed by `useCalendarSelector(selectDays)`. shadcn-styled.
 */
import { ScrollView, Text, View } from 'react-native';

import {
  CalendarProvider,
  selectDays,
  useCalendarSelector,
} from 'react-native-fast-calendar';

const COLS = 7;
const CELL = 36;

function isoWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

function WeekNumberCalendar() {
  const days = useCalendarSelector(selectDays);
  const rows = days.cells.length / COLS;

  return (
    <View className="bg-card border-hairline border-border rounded-xl p-4">
      <Text className="text-muted text-[11px] font-semibold tracking-widest uppercase mb-2">
        ISO week numbers
      </Text>
      <Text className="text-foreground text-sm font-semibold mb-3 text-center">
        {days.displayedMonthLabel} {days.displayedYearLabel}
      </Text>

      <View className="flex-row">
        <Text
          className="text-muted text-[11px] font-medium tracking-widest text-center uppercase mr-1.5"
          style={{ width: CELL, height: CELL, lineHeight: CELL }}
        >
          Wk
        </Text>
        {days.weekdayLabels.map((label) => (
          <Text
            key={label}
            className="text-muted text-[11px] font-medium tracking-widest text-center uppercase"
            style={{ width: CELL, height: CELL, lineHeight: CELL }}
          >
            {label.slice(0, 2)}
          </Text>
        ))}
      </View>

      {Array.from({ length: rows }).map((_, r) => {
        const rowCells = days.cells.slice(r * COLS, (r + 1) * COLS);
        const ref = rowCells[0];
        const wn = ref ? isoWeekNumber(ref.nativeDate) : 0;
        return (
          <View key={r} className="flex-row">
            <Text
              className="bg-surface-muted rounded-md text-muted text-[11px] font-semibold text-center mr-1.5"
              style={{ width: CELL, height: CELL, lineHeight: CELL }}
            >
              {wn}
            </Text>
            {rowCells.map((cell) => (
              <Text
                key={cell.nativeDate.toISOString()}
                className={`text-[13px] font-medium text-center ${
                  cell.isCurrentMonth
                    ? 'text-foreground'
                    : 'text-muted opacity-50'
                }`}
                style={{ width: CELL, height: CELL, lineHeight: CELL }}
              >
                {cell.label}
              </Text>
            ))}
          </View>
        );
      })}
    </View>
  );
}

export default function WeekNumbersExample() {
  return (
    <ScrollView className="bg-background" contentContainerClassName="p-4">
      <CalendarProvider mode="single" firstDayOfWeek={1}>
        <WeekNumberCalendar />
      </CalendarProvider>
    </ScrollView>
  );
}
