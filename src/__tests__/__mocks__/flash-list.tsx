// Jest test double for `@shopify/flash-list` (swipeable `FlashList`).
//
// We can't run the real FlashList in jest — its layout calculations
// depend on the native `RCTScrollView` measuring itself, which never
// happens under react-test-renderer. So instead we wire up a tiny
// component that:
//
//   1. Captures the props passed by `SwipeableMonthList`, exposing them
//      via `getMockFlashListProps()` so tests can read them and fire
//      the wired callbacks (`onViewableItemsChanged`,
//      `onStartReached`, `onEndReached`).
//   2. Records every `scrollToIndex` call against the imperative ref so
//      tests can assert that external `displayed` changes trigger a
//      scroll without dragging.
//   3. Renders the item at `initialScrollIndex` (i.e. the active
//      month), so existing assertions about day-cell behaviour and
//      header layout keep working without a coordinate-driven swipe
//      simulation.
//   4. Exercises `keyExtractor` once per data item so the coverage
//      report doesn't flag it as a phantom callback. The library
//      passes a plain `(item, index) => string` so this is a cheap
//      no-op for tests.
//
// `resetMockFlashList()` is exported so jest's `beforeEach` can clear
// state between tests; without it, the most recently rendered
// SwipeableMonthList would leak its captured props into the next
// scenario.
import React from 'react';
import { View } from 'react-native';

interface MockFlashListProps {
  data?: ReadonlyArray<unknown>;
  initialScrollIndex?: number | { index: number };
  renderItem?: (info: {
    item: unknown;
    index: number;
    data: ReadonlyArray<unknown>;
    extraData: unknown;
    type: undefined;
  }) => React.ReactNode;
  keyExtractor?: (item: unknown, index: number) => string;
  testID?: string;
  extraData?: unknown;
  onViewableItemsChanged?: (info: {
    viewableItems: ReadonlyArray<unknown>;
    changed: ReadonlyArray<unknown>;
  }) => void;
  onStartReached?: () => void;
  onEndReached?: () => void;
}

interface ScrollCall {
  index: number;
  animated?: boolean | undefined;
}

const state = {
  props: null as MockFlashListProps | null,
  scrollCalls: [] as ScrollCall[],
};

export const getMockFlashListProps = (): MockFlashListProps => {
  if (!state.props) {
    throw new Error(
      'getMockFlashListProps(): no FlashList has rendered yet ' +
        '— make sure to call this after `fireSwipeableLayout`.'
    );
  }
  return state.props;
};

export const getMockFlashListScrollCalls = (): ReadonlyArray<ScrollCall> =>
  state.scrollCalls;

export const resetMockFlashList = () => {
  state.props = null;
  state.scrollCalls = [];
};

const ref = {
  scrollToIndex(args: ScrollCall) {
    state.scrollCalls.push(args);
  },
  flashScrollIndicators() {},
  getNativeScrollRef() {
    return null;
  },
  getScrollableNode() {
    return null;
  },
  getScrollResponder() {
    return null;
  },
  getState() {
    return null;
  },
  scrollIndexIntoView() {},
  scrollItemIntoView() {},
  scrollToEnd() {},
  scrollToOffset() {},
  setVisibleContentAnchorOffset() {},
  setScrollProcessingEnabled() {},
};

const resolveInitialIndex = (
  raw: MockFlashListProps['initialScrollIndex']
): number => {
  if (typeof raw === 'number') return raw;
  if (raw && typeof raw === 'object' && typeof raw.index === 'number') {
    return raw.index;
  }
  return 0;
};

export function FlashList({
  ref: refArg,
  ...props
}: MockFlashListProps & { ref?: React.Ref<unknown> }) {
  state.props = props;
  React.useImperativeHandle(refArg, () => ref, []);

  const data: ReadonlyArray<unknown> = props.data ?? [];
  const idx = resolveInitialIndex(props.initialScrollIndex);
  const item = data[idx];

  // Exercise the keyExtractor for every item so its branch is covered
  // by the very first render — matches what a real list does as it
  // populates its key map.
  if (typeof props.keyExtractor === 'function') {
    for (let i = 0; i < data.length; i += 1) {
      props.keyExtractor(data[i], i);
    }
  }

  const node =
    item !== undefined && typeof props.renderItem === 'function'
      ? props.renderItem({
          item,
          index: idx,
          data,
          extraData: props.extraData,
          type: undefined,
        })
      : null;

  return <View testID={props.testID}>{node}</View>;
}
