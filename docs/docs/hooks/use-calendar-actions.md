---
sidebar_position: 3
---

# useCalendarActions

The `useCalendarActions` hook provides confirm and clear actions for the calendar, along with a `canConfirm` flag that indicates if the current selection is valid.

## Signature

```ts
interface CalendarActions {
  /** Confirm the current selection */
  confirm: () => void;
  /** Clear all selection state */
  clear: () => void;
  /** Whether current selection can be confirmed */
  canConfirm: boolean;
}

function useCalendarActions(): CalendarActions;
```

## Basic Usage

```tsx
import { useCalendarActions } from 'react-native-fast-calendar';

function MyFooter() {
  const { confirm, clear, canConfirm } = useCalendarActions();

  return (
    <View>
      <Button onPress={clear} title="Clear" />
      <Button
        onPress={confirm}
        title="Confirm"
        disabled={!canConfirm}
      />
    </View>
  );
}
```

## canConfirm Logic

The `canConfirm` value depends on the selection mode:

| Mode | `canConfirm` is `true` when |
|------|---------------------------|
| `single` | A date is selected |
| `range` | Both start and end are selected |
| `multiple` | At least one date is selected |

```tsx
// These are equivalent
const { canConfirm } = useCalendarActions();

// vs. manual check
const canConfirmManual = useCalendarSelector(s => {
  if (s.mode === 'single') return !!s.selectedDate;
  if (s.mode === 'multiple') return s.selectedDates.length > 0;
  return !!(s.rangeStart && s.rangeEnd);
});
```

## Confirm Behavior

When `confirm()` is called:

1. Reads the latest snapshot from the store
2. Builds a `CalendarSelectionPayload` object
3. Calls `onConfirm` callback from `<Calendar.Root>` props

```ts
interface CalendarSelectionPayload {
  date?: Date;              // Single mode
  startDate?: Date;         // Range mode
  endDate?: Date;           // Range mode
  dates?: Date[];           // Multiple mode
  systemId: string;         // Active calendar system
}
```

## Clear Behavior

When `clear()` is called:

1. Calls `store.clear()` to wipe selection state
2. Calls `onClear` callback from `<Calendar.Root>` props (if provided)

## Complete Example

```tsx
import { Calendar, useCalendarActions, useCalendarLabels } from 'react-native-fast-calendar';

function ActionExample() {
  return (
    <Calendar.Root
      mode="range"
      onConfirm={({ startDate, endDate }) => {
        console.log('Confirmed range:', startDate, endDate);
      }}
      onClear={() => {
        console.log('Selection cleared');
      }}
    >
      <CalendarContent />
    </Calendar.Root>
  );
}

function CalendarContent() {
  const { confirm, clear, canConfirm } = useCalendarActions();
  const { confirm: confirmLabel, clear: clearLabel } = useCalendarLabels();

  return (
    <View>
      <Calendar.DayGrid />

      <View style={styles.footer}>
        <Button
          onPress={clear}
          title={clearLabel}
          variant="ghost"
        />
        <Button
          onPress={confirm}
          title={confirmLabel}
          disabled={!canConfirm}
          variant="primary"
        />
      </View>
    </View>
  );
}
```

## Custom Confirm Button

```tsx
function MyConfirmButton() {
  const { confirm, canConfirm } = useCalendarActions();
  const { confirm: label } = useCalendarLabels();

  return (
    <TouchableOpacity
      onPress={confirm}
      disabled={!canConfirm}
      style={[
        styles.button,
        !canConfirm && styles.disabled,
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}
```

## Form Integration

```tsx
function BookingForm() {
  const [booking, setBooking] = useState(null);

  return (
    <Calendar.Root
      mode="range"
      minRangeDays={2}
      maxRangeDays={14}
      onConfirm={({ startDate, endDate }) => {
        setBooking({ checkIn: startDate, checkOut: endDate });
      }}
    >
      <View>
        <Calendar.DayGrid />
        <BookingActions />
      </View>
    </Calendar.Root>
  );
}

function BookingActions() {
  const { confirm, clear, canConfirm } = useCalendarActions();

  return (
    <View style={styles.actions}>
      <Pressable onPress={clear} style={styles.secondaryButton}>
        <Text>Reset</Text>
      </Pressable>
      <Pressable
        onPress={confirm}
        disabled={!canConfirm}
        style={[
          styles.primaryButton,
          !canConfirm && styles.disabled,
        ]}
      >
        <Text style={styles.primaryButtonText}>
          Book Selected Dates
        </Text>
      </Pressable>
    </View>
  );
}
```

## Important Notes

### Stable Identities

All three values have stable identities and can be used in `useEffect` or passed to memoized components:

```tsx
const { confirm, clear, canConfirm } = useCalendarActions();

// Safe to use in dependencies
useEffect(() => {
  if (canConfirm) {
    // Do something
  }
}, [canConfirm]);

// Safe to pass to memoized child
<MemoizedButton onPress={confirm} disabled={!canConfirm} />
```

### No-op Without Callback

`confirm()` is a no-op if `onConfirm` wasn't provided to `<Calendar.Root>`. It won't throw an error.

### Granular Subscription

`canConfirm` is subscribed via a granular selector. Toggling between two valid selections (e.g., swapping one selected date for another in single mode) won't cause `canConfirm` to change, so consumers that pass it to memoized buttons will skip re-renders.
