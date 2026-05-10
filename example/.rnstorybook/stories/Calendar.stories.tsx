import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';

import CalendarDemo from '../../src/CalendarDemo';
import ArabicCalendarExample from '../../src/ArabicCalendarExample';
import BottomSheetCalendarDemo from '../../src/BottomSheetExample';
import FlightPriceExample from '../../src/FlightPriceExample';
import VerticalCalendarDemo from '../../src/VerticalCalendarExample';
import {
  VerticalRangeExample,
  VerticalMultipleExample,
  VerticalBoundedExample,
  VerticalMultiMonthExample,
  VerticalMultiSystemExample,
  VerticalCustomSlotsExample,
  VerticalLocalisedExample,
  VerticalImageCellExample,
} from '../../src/VerticalCalendarExamples';

// ---------------------------------------------------------------------------
// Decorators
// ---------------------------------------------------------------------------

/** Fills the screen — required for scroll-based and flex-based layouts. */
const FullScreenDecorator = (Story: () => React.JSX.Element) => (
  <View style={{ flex: 1 }}>
    <Story />
  </View>
);

// ---------------------------------------------------------------------------
// Standard / horizontal demos
// ---------------------------------------------------------------------------

const standardMeta = {
  title: 'Calendar/Standard',
  component: CalendarDemo,
  decorators: [FullScreenDecorator],
} satisfies Meta<typeof CalendarDemo>;

export default standardMeta;

type StandardStory = StoryObj<typeof standardMeta>;

/**
 * Full feature showcase: single date, range, multi-select with modifiers,
 * bounded selection, multi-month, multi-system, custom slots, localisation,
 * and image cells — all nine recipes in one scrollable screen.
 */
export const Standard: StandardStory = {};

// ---------------------------------------------------------------------------
// Arabic / RTL
// ---------------------------------------------------------------------------

export const Arabic: StoryObj = {
  name: 'Arabic (RTL)',
  render: () => (
    <View style={{ flex: 1 }}>
      <ArabicCalendarExample />
    </View>
  ),
};

// ---------------------------------------------------------------------------
// Bottom sheet
// ---------------------------------------------------------------------------

export const BottomSheet: StoryObj = {
  name: 'Bottom Sheet',
  render: () => (
    <View style={{ flex: 1 }}>
      <BottomSheetCalendarDemo />
    </View>
  ),
};

// ---------------------------------------------------------------------------
// Flight price calendar — dark themed, fare-aware range picker
// ---------------------------------------------------------------------------

export const FlightPrice: StoryObj = {
  name: 'Flight Price (range + fares)',
  render: () => (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <FlightPriceExample />
    </View>
  ),
};

// ---------------------------------------------------------------------------
// Vertical (iOS-Calendar-style) — basic
// ---------------------------------------------------------------------------

export const Vertical: StoryObj = {
  name: 'Vertical (infinite list)',
  render: () => (
    <View style={{ flex: 1 }}>
      <VerticalCalendarDemo />
    </View>
  ),
};

// ---------------------------------------------------------------------------
// Vertical — feature gallery
// ---------------------------------------------------------------------------

export const VerticalRange: StoryObj = {
  name: 'Vertical · Range',
  render: () => (
    <View style={{ flex: 1 }}>
      <VerticalRangeExample />
    </View>
  ),
};

export const VerticalMultiple: StoryObj = {
  name: 'Vertical · Multi-select',
  render: () => (
    <View style={{ flex: 1 }}>
      <VerticalMultipleExample />
    </View>
  ),
};

export const VerticalBounded: StoryObj = {
  name: 'Vertical · Bounded',
  render: () => (
    <View style={{ flex: 1 }}>
      <VerticalBoundedExample />
    </View>
  ),
};

export const VerticalWeekNumbers: StoryObj = {
  name: 'Vertical · Week Numbers',
  render: () => (
    <View style={{ flex: 1 }}>
      <VerticalMultiMonthExample />
    </View>
  ),
};

export const VerticalMultiSystem: StoryObj = {
  name: 'Vertical · Multi-system',
  render: () => (
    <View style={{ flex: 1 }}>
      <VerticalMultiSystemExample />
    </View>
  ),
};

export const VerticalCustomSlots: StoryObj = {
  name: 'Vertical · Custom Slots',
  render: () => (
    <View style={{ flex: 1 }}>
      <VerticalCustomSlotsExample />
    </View>
  ),
};

export const VerticalLocalised: StoryObj = {
  name: 'Vertical · Localised (FR)',
  render: () => (
    <View style={{ flex: 1 }}>
      <VerticalLocalisedExample />
    </View>
  ),
};

export const VerticalImageCells: StoryObj = {
  name: 'Vertical · Image Cells',
  render: () => (
    <View style={{ flex: 1 }}>
      <VerticalImageCellExample />
    </View>
  ),
};
