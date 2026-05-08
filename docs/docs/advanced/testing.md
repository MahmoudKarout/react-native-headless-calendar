---
sidebar_position: 3
---

# Testing

Testing calendar components requires special consideration for date manipulation and user interactions.

## Unit Testing

### Testing Custom Hooks

```tsx
import { renderHook } from '@testing-library/react-hooks';
import { Calendar } from 'react-native-fast-calendar';
import { useCalendarActions } from 'react-native-fast-calendar';

const wrapper = ({ children }) => (
  <Calendar.Root mode="single">{children}</Calendar.Root>
);

it('should confirm selection', () => {
  const onConfirm = jest.fn();

  const { result } = renderHook(
    () => useCalendarActions(),
    { wrapper: ({ children }) => (
      <Calendar.Root mode="single" onConfirm={onConfirm}>
        {children}
      </Calendar.Root>
    )}
  );

  // Select a date first
  act(() => {
    store.selectDate(date);
  });

  // Then confirm
  act(() => {
    result.current.confirm();
  });

  expect(onConfirm).toHaveBeenCalled();
});
```

### Testing Calendar Systems

```tsx
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';

describe('Gregorian System', () => {
  it('should convert native date correctly', () => {
    const date = new Date(2024, 4, 15);
    const result = gregorianSystem.fromNativeDate(date);

    expect(result).toEqual({ y: 2024, m: 4, d: 15 });
  });

  it('should calculate weekdays correctly', () => {
    const monday = { y: 2024, m: 4, d: 13 }; // May 13, 2024
    expect(gregorianSystem.weekday(monday)).toBe(1); // Monday
  });

  it('should handle leap years', () => {
    const leapFeb = { y: 2024, m: 1, d: 29 };
    expect(gregorianSystem.daysInMonth(leapFeb)).toBe(29);
  });
});
```

## Component Testing

### Testing DayGrid

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Calendar } from 'react-native-fast-calendar';

it('should select a date on press', () => {
  const onConfirm = jest.fn();

  const { getByText } = render(
    <Calendar.Root mode="single" onConfirm={onConfirm}>
      <Calendar.DayGrid />
    </Calendar.Root>
  );

  // Find and press a day
  const day15 = getByText('15');
  fireEvent.press(day15);

  // Confirm selection
  const confirmButton = getByText('Confirm');
  fireEvent.press(confirmButton);

  expect(onConfirm).toHaveBeenCalled();
});
```

### Testing with Specific Dates

```tsx
import MockDate from 'mockdate';

beforeEach(() => {
  // Mock "today" to a specific date
  MockDate.set('2024-05-15');
});

afterEach(() => {
  MockDate.reset();
});

it('should highlight today', () => {
  const { getByText } = render(
    <Calendar.Root mode="single">
      <Calendar.DayGrid />
    </Calendar.Root>
  );

  // Today (15) should have today styles
  const today = getByText('15');
  expect(today).toHaveStyle({ borderWidth: 1 });
});
```

### Testing Disabled Dates

```tsx
it('should not select disabled dates', () => {
  const onSelect = jest.fn();

  const { getByText } = render(
    <Calendar.Root
      mode="single"
      disabled={(date) => date.getDay() === 0}
      onSelect={onSelect}
    >
      <Calendar.DayGrid />
    </Calendar.Root>
  );

  // Try to select a Sunday
  const sunday = getByText('12'); // Assuming 12th is Sunday
  fireEvent.press(sunday);

  expect(onSelect).not.toHaveBeenCalled();
});
```

## E2E Testing

### Detox Example

```tsx
// e2e/calendar.test.js
describe('Calendar', () => {
  it('should select a date range', async () => {
    await element(by.id('calendar.day.2024-05-15')).tap();
    await element(by.id('calendar.day.2024-05-20')).tap();
    await element(by.id('calendar.confirm')).tap();

    await expect(element(by.text('May 15 - May 20'))).toBeVisible();
  });
});
```

## Test IDs

The library supports test IDs via the `testID` prop:

```tsx
<Calendar.Root testID="booking-calendar" mode="range">
  <Calendar.DayGrid />
</Calendar.Root>
```

Generated test IDs:
- `booking-calendar.calendar.day.YYYY-MM-DD`
- `booking-calendar.calendar.swipeable`
- `booking-calendar.simple.confirm`
- `booking-calendar.simple.clear`

## Snapshot Testing

```tsx
it('renders correctly', () => {
  const tree = renderer.create(
    <SimpleCalendar mode="single" />
  ).toJSON();

  expect(tree).toMatchSnapshot();
});
```

:::warning
Snapshots can be brittle with dates. Consider mocking dates or excluding date-sensitive parts.
:::

## Accessibility Testing

```tsx
it('should have correct accessibility labels', () => {
  const { getByLabelText } = render(
    <Calendar.Root mode="single">
      <Calendar.DayGrid />
    </Calendar.Root>
  );

  // Days should have labels
  const day15 = getByLabelText('15');
  expect(day15).toHaveAccessibilityState({ selected: false });
});
```

## Performance Testing

```tsx
it('should render without unnecessary re-renders', () => {
  const renderCount = jest.fn();

  function TrackedCell({ info }) {
    renderCount();
    return <DayCell info={info} />;
  }

  const { getByText } = render(
    <Calendar.Root mode="single">
      <Calendar.DayGrid renderDay={(info) => <TrackedCell info={info} />} />
    </Calendar.Root>
  );

  // Select one date
  fireEvent.press(getByText('15'));

  // Should only re-render 1-4 cells, not all 42
  expect(renderCount).toHaveBeenCalledTimes(4);
});
```
