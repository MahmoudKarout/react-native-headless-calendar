---
sidebar_position: 2
---

# Installation

## NPM/Yarn

```bash
npm install react-native-fast-calendar
# or
yarn add react-native-fast-calendar
```

## Peer Dependencies

The core library requires:

```bash
npm install react react-native
```

### Optional Peer Dependencies

Depending on your use case, you may need additional dependencies:

#### For Swipeable Mode (FlashList)

```bash
npm install @shopify/flash-list
```

Required when using `<Calendar.DayGrid swipeable />`.

#### For Hijri Calendar Support

```bash
npm install @tabby_ai/hijri-converter
```

Required when using the Hijri calendar system.

#### For Jalali (Persian) Calendar Support

```bash
npm install moment-jalaali
```

Required when using the Jalali calendar system.

#### For Bottom Sheet Integration

```bash
npm install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler
```

Required when building bottom sheet date pickers.

## TypeScript Configuration

The library is written in TypeScript and provides comprehensive type definitions. No additional `@types` package is needed.

## React Native Version Requirements

- React Native >= 0.70.0
- React >= 18.0.0

## Web Support

The library works with React Native Web. No additional configuration is required.

## AI Assistant Skill

Install the `react-native-fast-calendar-recipes` skill to give your AI coding assistant (Cursor, Claude, etc.) full knowledge of the library API — all eleven recipes, every hook, the headless scaffold, theming, multi-calendar systems, and common pitfalls.

```bash
npx skills install react-native-fast-calendar-recipes --registry https://skills.sh
```

The skill activates automatically whenever you ask your AI for a calendar, date picker, range picker, or anything involving `<Calendar.Root>`, `<Calendar.DayGrid>`, `SimpleCalendar`, or the `useCalendar*` hooks.

## Next Steps

Now that you have the library installed:

1. Check out the [SimpleCalendar component](./components/simple-calendar) for quick usage
2. Learn about the [headless API](./core-concepts/headless-design) for custom implementations
3. Explore [recipes](./recipes/single-date-picker) for common use cases
