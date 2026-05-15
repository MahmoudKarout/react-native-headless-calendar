import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  CalendarProvider,
  useCalendarSelector,
} from 'react-native-fast-calendar';

import { HooksCalendar } from './HooksCalendar';

const MIN_RANGE_DAYS = 2;
const MAX_RANGE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export default function DateRangePickerExample() {
  return (
    <ScrollView className="bg-background" contentContainerClassName="p-4">
      <CalendarProvider
        mode="range"
        allowSameDay
        minRangeDays={MIN_RANGE_DAYS}
        maxRangeDays={MAX_RANGE_DAYS}
        onConfirm={(p) => console.log(p)}
      >
        <RangeWithValidation />
      </CalendarProvider>
    </ScrollView>
  );
}

/**
 * Wraps `HooksCalendar` with an inline error banner that fires when the
 * user taps a date that would create a range outside the configured
 * [MIN_RANGE_DAYS, MAX_RANGE_DAYS] window. The library silently rejects
 * those picks, so without surfacing the error the calendar looks broken.
 *
 * The banner sticks until the user lands a valid pick (range completes
 * or selection resets) — no auto-dismiss.
 */
function RangeWithValidation() {
  const rangeStartMs = useCalendarSelector((s) =>
    s.mode === 'range' && s.rangeStart
      ? s.system.toNativeDate(s.rangeStart).getTime()
      : null
  );
  const rangeEndMs = useCalendarSelector((s) =>
    s.mode === 'range' && s.rangeEnd
      ? s.system.toNativeDate(s.rangeEnd).getTime()
      : null
  );

  const [error, setError] = useState<string | null>(null);

  // Clear the error as soon as the user lands a valid pick (range
  // completes) or resets the selection entirely.
  useEffect(() => {
    if (error && (rangeEndMs !== null || rangeStartMs === null)) {
      setError(null);
    }
  }, [rangeStartMs, rangeEndMs, error]);

  return (
    <>
      {error ? <ErrorBanner message={error} /> : null}
      <HooksCalendar
        caption="Range · 2–14 nights"
        onSelectDate={(_date, cell) => {
          // Only the *second* tap can violate the cap. If there's no
          // pending start, this tap will become the new start — always
          // valid.
          if (rangeStartMs === null || rangeEndMs !== null) return;
          // Inclusive day count: [start, end] of length 1 = same day.
          // Use `nativeDate` so this works across any calendar system.
          const lenDays =
            Math.floor((cell.nativeDate.getTime() - rangeStartMs) / DAY_MS) +
            1;
          if (lenDays > MAX_RANGE_DAYS) {
            setError(
              `You can't select more than ${MAX_RANGE_DAYS} days. Try a closer end date.`
            );
          } else if (lenDays > 0 && lenDays < MIN_RANGE_DAYS) {
            setError(
              `Range must be at least ${MIN_RANGE_DAYS} days. Try a later end date.`
            );
          }
        }}
      />
    </>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <View className="flex-row items-center gap-2 mb-3 px-3 py-2.5 rounded-md bg-danger-soft border-hairline border-danger">
      <View className="w-5 h-5 rounded-full bg-danger items-center justify-center">
        <Text className="text-on-primary text-[12px] font-bold leading-none">
          !
        </Text>
      </View>
      <Text className="text-danger text-[13px] font-medium flex-1">
        {message}
      </Text>
    </View>
  );
}
