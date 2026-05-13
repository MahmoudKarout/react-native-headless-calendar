---
sidebar_position: 2
---

# Installation

```bash
npm install react-native-fast-calendar
# or
yarn add react-native-fast-calendar
```

## Peer Dependencies

The core has no runtime dependencies beyond React and React Native:

```bash
npm install react react-native
```

### Optional — Hijri Calendar

```bash
npm install @tabby_ai/hijri-converter
```

Required only when you import `react-native-fast-calendar/systems/hijri`.

### Optional — Jalali (Persian) Calendar

```bash
npm install moment-jalaali
```

Required only when you import `react-native-fast-calendar/systems/jalali`.

### Optional — Bottom-Sheet Recipe

```bash
npm install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler
```

### Optional — Vertical List Recipe

```bash
npm install @shopify/flash-list
```

## Requirements

- React `>= 18.0.0`
- React Native `>= 0.70.0`
- TypeScript types ship with the package.

## Web Support

Works out of the box with React Native Web — including the live demos in this docset.

## Next Steps

- [Mental Model](./core-concepts/mental-model)
- [Single date picker recipe](./recipes/single-date-picker)
