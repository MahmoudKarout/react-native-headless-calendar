---
sidebar_position: 2
---

# Installation

```bash
yarn add react-native-headless-calendar
```

### Optional — Hijri Calendar

```bash
yarn add @tabby_ai/hijri-converter
```

Required only when you import `react-native-headless-calendar/systems/hijri`.

### Optional — Jalali (Persian) Calendar

```bash
yarn add moment-jalaali
```

Required only when you import `react-native-headless-calendar/systems/jalali`.

## Requirements

- React `>= 18.0.0`
- React Native `>= 0.70.0`
- TypeScript types ship with the package.

## Quick Start

```tsx
import {
  SingleDateProvider,
  selectSingleDays,
  useSingleCalendarActions,
  useSingleCalendarSelector,
} from 'react-native-headless-calendar';
```

Pick the provider that matches your selection mode — see [Providers](./hooks/providers).

**Note:** `firstDayOfWeek` defaults to **Monday (`1`)**. Pass `0` for a Sunday-first grid.

## Web Support

Works out of the box with React Native Web.

## Next Steps

- [Mental Model](./core-concepts/mental-model)
- [Providers](./hooks/providers)
