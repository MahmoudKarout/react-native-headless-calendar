---
sidebar_position: 1
---

# Introduction

`react-native-fast-calendar` is a **headless, high-performance calendar library** for React Native. It provides the core logic for calendar functionality while giving you complete control over the UI.

import CalendarDemo from '@site/src/components/CalendarDemo';

## Try It Out

Here's a live, interactive demo. Click on dates to select them:

<CalendarDemo mode="single" />

## Key Features

- **Headless by Design** — The library ships only essential components. You bring your own UI and wire it to the store via hooks.
- **High Performance** — Granular subscriptions mean only components that need to update will re-render. Day taps don't re-render the header, system switcher, or action bar.
- **Multi-Calendar System Support** — Built-in Gregorian calendar with pre-configured Hijri and Jalali (Persian) systems. BYO for Chinese, Ethiopian, or any other calendar.
- **Zero Dependencies** — The core has zero calendar-system dependencies. Optional peer dependencies for specific features.
- **TypeScript First** — Fully typed with comprehensive interfaces.
- **Accessible** — Built with accessibility in mind, including proper labels and roles.

## Quick Start

The simplest way to get started is with `SimpleCalendar`, a batteries-included component:

```tsx
import { SimpleCalendar } from 'react-native-fast-calendar';

function MyScreen() {
  return (
    <SimpleCalendar
      mode="single"
      onConfirm={({ date }) => console.log('Selected:', date)}
    />
  );
}
```

## The Mental Model

Understanding the library's architecture will help you use it effectively:

```tsx
// 1. Root provides the store
<Calendar.Root mode="single">
  {/* 2. Header uses navigation hooks */}
  <MyHeader />

  {/* 3. View renders the grid or pickers */}
  <MyView />

  {/* 4. Readout shows selected dates */}
  <MyReadout />

  {/* 5. Actions for confirm/clear */}
  <MyActionBar />
</Calendar.Root>
```

| Layer | Purpose | Hooks Used |
|-------|---------|------------|
| L1 | Optional header (chevrons, month/year) | `useCalendarHeader`, `useCalendarNavigation` |
| L2 | Day grid OR month/year pickers | `useCalendarSelector`, `useCalendarDayGrid` |
| L3 | Selection readout | `useCalendarSelector`, `useCalendarSelectedDates` |
| L4 | Action bar | `useCalendarActions`, `useCalendarLabels` |

## What's Next?

- [Installation](./installation) — Get the library set up in your project
- [Mental Model](./core-concepts/mental-model) — Deep dive into the architecture
- [SimpleCalendar](./components/simple-calendar) — Learn about the batteries-included component
- [Calendar.Root](./components/calendar-root) — Understand the headless API
