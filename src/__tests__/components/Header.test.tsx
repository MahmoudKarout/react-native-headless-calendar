import React from 'react';
import { I18nManager, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { Header } from '../../components/Header';
import { Root } from '../../components/Root';
import { useCalendarStore } from '../../context';
import { gregorianSystem } from '../../systems/gregorian';

const wrap = (ui: React.ReactNode) =>
  render(
    <Root
      initialDate={new Date(2024, 4, 15)}
      systems={[gregorianSystem]}
      testID="cal"
    >
      {ui}
    </Root>
  );

afterEach(() => {
  // Defensive: tests below mutate I18nManager.isRTL via spies; reset.
  jest.restoreAllMocks();
});

describe('<Calendar.Header /> preset', () => {
  it('renders prev/next buttons and month/year labels', () => {
    const { getByTestId, getByText } = wrap(<Header />);
    expect(getByTestId('cal.calendar.prev')).toBeTruthy();
    expect(getByTestId('cal.calendar.next')).toBeTruthy();
    expect(getByText('May')).toBeTruthy();
    expect(getByText('2024')).toBeTruthy();
  });
});

describe('Header.PrevButton / Header.NextButton', () => {
  it('changeMonth(-1) on prev tap when not RTL', () => {
    const { getByTestId, getByText } = wrap(<Header />);
    fireEvent.press(getByTestId('cal.calendar.prev'));
    expect(getByText('April')).toBeTruthy();
  });

  it('changeMonth(+1) on next tap when not RTL', () => {
    const { getByTestId, getByText } = wrap(<Header />);
    fireEvent.press(getByTestId('cal.calendar.next'));
    expect(getByText('June')).toBeTruthy();
  });

  it('inverts step direction in RTL', () => {
    const original = I18nManager.isRTL;
    Object.defineProperty(I18nManager, 'isRTL', {
      configurable: true,
      value: true,
    });
    try {
      const { getByTestId, getByText } = wrap(<Header />);
      fireEvent.press(getByTestId('cal.calendar.prev'));
      expect(getByText('June')).toBeTruthy();
      fireEvent.press(getByTestId('cal.calendar.next'));
      expect(getByText('May')).toBeTruthy();
    } finally {
      Object.defineProperty(I18nManager, 'isRTL', {
        configurable: true,
        value: original,
      });
    }
  });

  it('changeYear(±1) when view is "month"', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    const Probe = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Probe />
        <Header />
      </Root>
    );
    act(() => {
      storeRef!.setView('month');
    });
    fireEvent.press(getByTestId('cal.calendar.next'));
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2025 })
    );
  });

  it('changeYear(-1) on prev tap when view is "month"', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    const Probe = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Probe />
        <Header />
      </Root>
    );
    act(() => {
      storeRef!.setView('month');
    });
    fireEvent.press(getByTestId('cal.calendar.prev'));
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2023 })
    );
  });

  it('paginates back by YEAR_PAGE_SIZE on prev tap when view is "year"', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    const Probe = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Probe />
        <Header />
      </Root>
    );
    act(() => {
      storeRef!.setView('year');
    });
    fireEvent.press(getByTestId('cal.calendar.prev'));
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2024 - 12 })
    );
  });

  it('paginates by YEAR_PAGE_SIZE when view is "year"', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    const Probe = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Probe />
        <Header />
      </Root>
    );
    act(() => {
      storeRef!.setView('year');
    });
    fireEvent.press(getByTestId('cal.calendar.next'));
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2024 + 12 })
    );
  });

  it('renders custom child icons in PrevButton / NextButton', () => {
    const { getByText } = render(
      <Root systems={[gregorianSystem]} testID="cal">
        <Header.Root>
          <Header.PrevButton>
            <Text>«</Text>
          </Header.PrevButton>
          <Header.NextButton>
            <Text>»</Text>
          </Header.NextButton>
        </Header.Root>
      </Root>
    );
    expect(getByText('«')).toBeTruthy();
    expect(getByText('»')).toBeTruthy();
  });
});

describe('Header.MonthLabel', () => {
  it('toggles the view between day and month on tap', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    const Probe = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Probe />
        <Header />
      </Root>
    );
    fireEvent.press(getByTestId('cal.calendar.month'));
    expect(storeRef!.getSnapshot().view).toBe('month');
    fireEvent.press(getByTestId('cal.calendar.month'));
    expect(storeRef!.getSnapshot().view).toBe('day');
  });

  it('hides itself when the view is "year"', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    const Probe = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { queryByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Probe />
        <Header />
      </Root>
    );
    act(() => {
      storeRef!.setView('year');
    });
    expect(queryByTestId('cal.calendar.month')).toBeNull();
  });
});

describe('Header.YearLabel', () => {
  it('shows a single year in day view', () => {
    const { getByText } = wrap(<Header />);
    expect(getByText('2024')).toBeTruthy();
  });

  it('shows a year range when view is "year"', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    const Probe = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Probe />
        <Header />
      </Root>
    );
    act(() => {
      storeRef!.setView('year');
    });
    expect(getByTestId('cal.calendar.year')).toBeTruthy();
  });

  it('toggles year view on tap', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    const Probe = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Probe />
        <Header />
      </Root>
    );
    fireEvent.press(getByTestId('cal.calendar.year'));
    expect(storeRef!.getSnapshot().view).toBe('year');
    fireEvent.press(getByTestId('cal.calendar.year'));
    expect(storeRef!.getSnapshot().view).toBe('day');
  });

  it('falls back to empty string when month label index is out of range', () => {
    // Simulate a system whose monthLabels list is shorter than 12 to exercise
    // the `?? ''` fallback in MonthLabel's selector.
    const sys = { ...gregorianSystem, monthLabels: () => ['Jan'] };
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[sys]} testID="cal">
        <Header />
      </Root>
    );
    expect(getByTestId('cal.calendar.month')).toBeTruthy();
  });
});

describe('Header.Root composition', () => {
  it('renders without a testID prefix when one is not configured', () => {
    const { queryByTestId } = render(
      <Root systems={[gregorianSystem]}>
        <Header />
      </Root>
    );
    expect(queryByTestId('calendar.header')).toBeNull();
    expect(queryByTestId('cal.calendar.header')).toBeNull();
  });

  it('renders the header testID when configured', () => {
    const { getByTestId } = wrap(<Header />);
    expect(getByTestId('cal.calendar.header')).toBeTruthy();
  });
});
