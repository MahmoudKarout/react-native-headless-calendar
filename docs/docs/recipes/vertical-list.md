---
sidebar_position: 9
---

# Vertical List

An infinite scrolling vertical month list using `@shopify/flash-list` — similar to the iOS Calendar app.

import CalendarDemo from '@site/src/components/CalendarDemo';

## Interactive Demo

Months are stacked vertically with sticky captions and a scrollable viewport — the same UX FlashList provides on native:

<CalendarDemo mode="single" vertical />

## Dependencies

```bash
npm install @shopify/flash-list
```

## Concept

The vertical list displays months stacked vertically with infinite scroll. Unlike the swipeable horizontal pager, this uses FlashList's recycling to efficiently render hundreds of months.

## Basic Implementation

```tsx
import { useRef, useCallback } from 'react';
import { View, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  Calendar,
  useCalendarStore,
  useCalendarSelector,
  buildMonthGrid,
  useCalendarConfig,
  useCalendarTheme,
} from 'react-native-fast-calendar';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = 48;

function VerticalCalendar() {
  const store = useCalendarStore();
  const system = useCalendarSelector(s => s.system);
  const displayed = useCalendarSelector(s => s.displayed);

  // Generate months around current
  const months = useMemo(() => {
    const months = [];
    for (let i = -12; i <= 12; i++) {
      months.push(system.addMonths(displayed, i));
    }
    return months;
  }, [system, displayed]);

  const renderMonth = useCallback(({ item: month }) => (
    <MonthView
      month={month}
      onSelect={(date) => store.selectDate(date)}
    />
  ), [store]);

  return (
    <FlashList
      data={months}
      renderItem={renderMonth}
      estimatedItemHeight={300}
      keyExtractor={(month) =>
        `${system.year(month)}-${system.month(month)}`
      }
    />
  );
}

function MonthView({ month, onSelect }) {
  const system = useCalendarSelector(s => s.system);
  const config = useCalendarConfig();
  const theme = useCalendarTheme();

  const cells = useMemo(() =>
    buildMonthGrid(system, month, config.firstDayOfWeek),
    [system, month, config.firstDayOfWeek]
  );

  const monthName = system.monthLabels()[system.month(month)];
  const year = system.year(month);

// Brand-aligned typography from DESIGN.md
const TYPOGRAPHY = {
  monthCaption: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.02,  // Brand negative tracking
    color: '#171717',      // --ds-ink
  },
  dayCell: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4d4d4d',      // --ds-body
  },
  dayCellOutside: {
    opacity: 0.35,
  },
};

const DARK_TYPOGRAPHY = {
  monthCaption: {
    ...TYPOGRAPHY.monthCaption,
    color: '#ededed',      // --ds-ink (dark)
  },
  dayCell: {
    ...TYPOGRAPHY.dayCell,
    color: '#888888',      // --ds-body (dark)
  },
};

  return (
    <View style={{ width: SCREEN_WIDTH, padding: 16 }}>
      <Text style={TYPOGRAPHY.monthCaption}>
        {monthName} {year}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((cell) => (
          <Pressable
            key={cell.index}
            onPress={() => onSelect(cell.date)}
            accessibilityLabel={system.formatDay(cell.date)}
            accessibilityHint="Double tap to select date"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: cell.isCurrentMonth ? 1 : 0.3,
            }}
          >
            <Text style={[
              TYPOGRAPHY.dayCell,
              !cell.isCurrentMonth && TYPOGRAPHY.dayCellOutside,
            ]}>
              {system.formatDay(cell.date)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
```

## Integration with Calendar.Root

```tsx
function VerticalCalendarScreen() {
  return (
    <Calendar.Root mode="single">
      <View style={{ flex: 1 }}>
        <CalendarHeader />
        <VerticalCalendar />
      </View>
    </Calendar.Root>
  );
}
```

## Important Notes

- Vertical lists **always** treat outside-month cells as blank spacers
- This differs from `showOutsideDays` on `<Calendar.Root>`
- Adjacent months stack directly, so showing outside days would create duplicates

## Windowing

For true infinite scroll, implement windowing:

```tsx
function InfiniteVerticalCalendar() {
  const [window, setWindow] = useState({ start: -12, end: 12 });

  const onEndReached = () => {
    setWindow(w => ({ start: w.start, end: w.end + 6 }));
  };

  const onStartReached = () => {
    setWindow(w => ({ start: w.start - 6, end: w.end }));
  };

  const months = useMemo(() => {
    const list = [];
    for (let i = window.start; i <= window.end; i++) {
      list.push(system.addMonths(displayed, i));
    }
    return list;
  }, [window, system, displayed]);

  return (
    <FlashList
      data={months}
      onEndReached={onEndReached}
      onStartReached={onStartReached}
      // ...
    />
  );
}
```

## Complete Example

See the example app's `VerticalCalendarExamples.tsx` for a full implementation with:
- Selection highlighting
- Today indicator
- Smooth scrolling to today
- System change handling
