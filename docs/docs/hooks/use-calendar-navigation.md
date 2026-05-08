---
sidebar_position: 4
---

# useCalendarNavigation

The `useCalendarNavigation` hook provides `goPrev` and `goNext` functions for navigating through the calendar. It's view-aware and RTL-aware.

## Signature

```ts
interface CalendarNavigation {
  /** Step backward (month/year/year-page depending on view) */
  goPrev: () => void;
  /** Step forward (month/year/year-page depending on view) */
  goNext: () => void;
}

function useCalendarNavigation(): CalendarNavigation;
```

## Basic Usage

```tsx
import { useCalendarNavigation } from 'react-native-fast-calendar';

function MyHeader() {
  const { goPrev, goNext } = useCalendarNavigation();

  return (
    <View style={styles.header}>
      <Button onPress={goPrev} title="‹" />
      <Button onPress={goNext} title="›" />
    </View>
  );
}
```

## Navigation Rules

The step size depends on the current view:

| View | Step |
|------|------|
| `day` | 1 month |
| `month` | 1 year |
| `year` | 12 years (one page) |

```tsx
function MyNavigation() {
  const { goPrev, goNext } = useCalendarNavigation();
  const view = useCalendarSelector(s => s.view);

  return (
    <View>
      <Text>Current view: {view}</Text>
      <Button
        onPress={goPrev}
        title={view === 'year' ? '-12 years' : view === 'month' ? '-1 year' : '-1 month'}
      />
      <Button
        onPress={goNext}
        title={view === 'year' ? '+12 years' : view === 'month' ? '+1 year' : '+1 month'}
      />
    </View>
  );
}
```

## RTL Support

The hook automatically handles right-to-left layouts:

```tsx
import { I18nManager } from 'react-native';

// In RTL locales:
// - goPrev visually moves right (to later dates)
// - goNext visually moves left (to earlier dates)
const isRTL = I18nManager.isRTL;

function MyChevrons() {
  const { goPrev, goNext } = useCalendarNavigation();

  return (
    <View>
      {/* Visual arrows match reading direction */}
      <Button onPress={goPrev} title={isRTL ? '›' : '‹'} />
      <Button onPress={goNext} title={isRTL ? '‹' : '›'} />
    </View>
  );
}
```

## Complete Example

```tsx
import {
  Calendar,
  useCalendarNavigation,
  useCalendarMonthLabel,
  useCalendarYearLabel,
} from 'react-native-fast-calendar';

function NavigationExample() {
  return (
    <Calendar.Root mode="single">
      <View>
        <NavigationHeader />
        <Calendar.DayGrid />
      </View>
    </Calendar.Root>
  );
}

function NavigationHeader() {
  const { goPrev, goNext } = useCalendarNavigation();
  const month = useCalendarMonthLabel();
  const year = useCalendarYearLabel();

  return (
    <View style={styles.header}>
      <View style={styles.title}>
        {month.isVisible && (
          <Text style={styles.month}>{month.label}</Text>
        )}
        <Text style={styles.year}>{year.label}</Text>
      </View>

      <View style={styles.navButtons}>
        <TouchableOpacity
          onPress={goPrev}
          style={styles.navButton}
          accessibilityLabel="Previous"
        >
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={goNext}
          style={styles.navButton}
          accessibilityLabel="Next"
        >
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  month: {
    fontSize: 18,
    fontWeight: '600',
  },
  year: {
    fontSize: 18,
    fontWeight: '600',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
  },
  navArrow: {
    fontSize: 20,
    fontWeight: '500',
  },
});
```

## Keyboard Navigation

```tsx
import { useEffect } from 'react';
import { useCalendarNavigation } from 'react-native-fast-calendar';

function useKeyboardNavigation() {
  const { goPrev, goNext } = useCalendarNavigation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === 'ArrowRight') {
        goNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev, goNext]);
}
```

## Important Notes

### Stable Identity

Both `goPrev` and `goNext` have stable identities and won't cause unnecessary re-renders:

```tsx
const { goPrev, goNext } = useCalendarNavigation();

// Safe in useEffect
useEffect(() => {
  // goPrev and goNext are stable
}, []);

// Safe to pass to memoized components
<MemoizedNavButton onPress={goPrev} />
```

### Composes with Swipeable

The swipeable day grid internally calls `store.changeMonth()`, which updates the `displayed` state. The navigation buttons will automatically sync because they also dispatch to the same store.
