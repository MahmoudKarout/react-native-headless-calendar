import { I18nManager, Pressable, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { Root } from '../components/Root';
import {
  CalendarConfigContext,
  useCalendarActions,
  useCalendarConfig,
  useCalendarFirstDayOfWeek,
  useCalendarLabels,
  useCalendarMonthLabel,
  useCalendarMonthPicker,
  useCalendarNavigation,
  useCalendarSelector,
  useCalendarStore,
  useCalendarSystemSwitcher,
  useCalendarTheme,
  useCalendarWeekdayLabels,
  useCalendarYearLabel,
  useCalendarYearPicker,
} from '../context';
import { createGregorianSystem, gregorianSystem } from '../systems/gregorian';
import type { CalendarSystem } from '../types';

const Capture = <T,>({ run }: { run: () => T }) => {
  run();
  return null;
};

// Tiny helper: produce a Gregorian system with a forced `id` so multi-system
// tests can disambiguate without dragging in the Hijri converter.
const makeSystem = (id: string, label: string): CalendarSystem => {
  const sys = createGregorianSystem({ label });
  Object.defineProperty(sys, 'id', { value: id });
  return sys;
};

describe('useCalendarStore', () => {
  it('throws when used outside <Calendar.Root>', () => {
    expect(() => render(<Capture run={() => useCalendarStore()} />)).toThrow(
      /<Calendar.Root>/
    );
  });

  it('returns the store inside <Calendar.Root>', () => {
    let captured: unknown;
    render(
      <Root systems={[gregorianSystem]}>
        <Capture
          run={() => {
            captured = useCalendarStore();
          }}
        />
      </Root>
    );
    expect(captured).toBeDefined();
  });
});

describe('useCalendarSelector', () => {
  it('subscribes to a slice of state and updates on change', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    let lastView = '';
    const Probe = () => {
      storeRef = useCalendarStore();
      lastView = useCalendarSelector((s) => s.view);
      return null;
    };
    render(
      <Root systems={[gregorianSystem]}>
        <Probe />
      </Root>
    );
    expect(lastView).toBe('day');
    act(() => {
      storeRef!.setView('month');
    });
    expect(lastView).toBe('month');
  });
});

describe('useCalendarConfig', () => {
  it('throws when used outside <Calendar.Root>', () => {
    expect(() => render(<Capture run={() => useCalendarConfig()} />)).toThrow(
      /<Calendar.Root>/
    );
  });

  it('throws when the provider value is null', () => {
    // Force a null context value to exercise the fallback branch.
    expect(() =>
      render(
        <CalendarConfigContext.Provider value={null}>
          <Capture run={() => useCalendarConfig()} />
        </CalendarConfigContext.Provider>
      )
    ).toThrow(/<Calendar.Root>/);
  });

  it('returns the merged config inside <Calendar.Root>', () => {
    let captured: ReturnType<typeof useCalendarConfig> | null = null;
    render(
      <Root systems={[gregorianSystem]} testID="cal">
        <Capture
          run={() => {
            captured = useCalendarConfig();
          }}
        />
      </Root>
    );
    expect(captured).not.toBeNull();
    expect(captured!.systems).toEqual([gregorianSystem]);
    expect(captured!.testID).toBe('cal');
  });
});

describe('useCalendarTheme / useCalendarLabels', () => {
  it('returns slices of the merged config', () => {
    const captured: Record<string, unknown> = {};
    const Probe = () => {
      captured.theme = useCalendarTheme();
      captured.labels = useCalendarLabels();
      return <Text>ok</Text>;
    };
    const { getByText } = render(
      <Root systems={[gregorianSystem]}>
        <Probe />
      </Root>
    );
    expect(getByText('ok')).toBeTruthy();
    expect(captured.theme).toBeDefined();
    expect(captured.labels).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// useCalendarFirstDayOfWeek / useCalendarWeekdayLabels
// ---------------------------------------------------------------------------

describe('useCalendarFirstDayOfWeek', () => {
  const Probe = ({ capture }: { capture: (value: number) => void }) => {
    capture(useCalendarFirstDayOfWeek());
    return null;
  };

  it('throws when used outside <Calendar.Root>', () => {
    expect(() =>
      render(<Capture run={() => useCalendarFirstDayOfWeek()} />)
    ).toThrow(/<Calendar.Root>/);
  });

  it('defaults to 0 (Sunday) when the prop is not set', () => {
    let captured = -1;
    render(
      <Root systems={[gregorianSystem]}>
        <Probe capture={(v) => (captured = v)} />
      </Root>
    );
    expect(captured).toBe(0);
  });

  it('reflects the firstDayOfWeek prop when provided', () => {
    let captured = -1;
    render(
      <Root firstDayOfWeek={1} systems={[gregorianSystem]}>
        <Probe capture={(v) => (captured = v)} />
      </Root>
    );
    expect(captured).toBe(1);
  });
});

describe('useCalendarWeekdayLabels', () => {
  const Probe = ({
    capture,
  }: {
    capture: (labels: readonly string[]) => void;
  }) => {
    capture(useCalendarWeekdayLabels());
    return null;
  };

  it('throws when used outside <Calendar.Root>', () => {
    expect(() =>
      render(<Capture run={() => useCalendarWeekdayLabels()} />)
    ).toThrow(/<Calendar.Root>/);
  });

  it('returns the system labels unrotated when firstDayOfWeek=0', () => {
    let captured: readonly string[] = [];
    render(
      <Root systems={[gregorianSystem]}>
        <Probe capture={(v) => (captured = v)} />
      </Root>
    );
    expect(captured).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  });

  it('rotates the system labels for firstDayOfWeek=1 (Monday)', () => {
    let captured: readonly string[] = [];
    render(
      <Root firstDayOfWeek={1} systems={[gregorianSystem]}>
        <Probe capture={(v) => (captured = v)} />
      </Root>
    );
    expect(captured).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('rotates the system labels for firstDayOfWeek=6 (Saturday)', () => {
    let captured: readonly string[] = [];
    render(
      <Root firstDayOfWeek={6} systems={[gregorianSystem]}>
        <Probe capture={(v) => (captured = v)} />
      </Root>
    );
    expect(captured).toEqual(['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  });
});

// ---------------------------------------------------------------------------
// useCalendarActions
// ---------------------------------------------------------------------------

describe('useCalendarActions', () => {
  // Tiny harness that surfaces the hook's API as DOM nodes the test can
  // press / inspect — keeps the assertions focused on the hook contract.
  const ActionsHarness = () => {
    const { confirm, clear, canConfirm } = useCalendarActions();
    return (
      <>
        <Text testID="canConfirm">{canConfirm ? 'yes' : 'no'}</Text>
        <Pressable onPress={confirm} testID="confirm">
          <Text>confirm</Text>
        </Pressable>
        <Pressable onPress={clear} testID="clear">
          <Text>clear</Text>
        </Pressable>
      </>
    );
  };

  it('throws when used outside <Calendar.Root>', () => {
    expect(() => render(<Capture run={() => useCalendarActions()} />)).toThrow(
      /<Calendar.Root>/
    );
  });

  it('canConfirm is false on first render in single mode', () => {
    const { getByTestId } = render(
      <Root systems={[gregorianSystem]}>
        <ActionsHarness />
      </Root>
    );
    expect(getByTestId('canConfirm').props.children).toBe('no');
  });

  it('canConfirm becomes true once a single date is preselected', () => {
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <ActionsHarness />
      </Root>
    );
    expect(getByTestId('canConfirm').props.children).toBe('yes');
  });

  it('canConfirm stays false in range mode without both endpoints', () => {
    const { getByTestId } = render(
      <Root
        initialStart={new Date(2024, 4, 15)}
        mode="range"
        systems={[gregorianSystem]}
      >
        <ActionsHarness />
      </Root>
    );
    expect(getByTestId('canConfirm').props.children).toBe('no');
  });

  it('canConfirm flips to true once both range endpoints exist', () => {
    const { getByTestId } = render(
      <Root
        initialEnd={new Date(2024, 4, 20)}
        initialStart={new Date(2024, 4, 15)}
        mode="range"
        systems={[gregorianSystem]}
      >
        <ActionsHarness />
      </Root>
    );
    expect(getByTestId('canConfirm').props.children).toBe('yes');
  });

  it('confirm fires onConfirm with the single-mode payload', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        onConfirm={onConfirm}
        systems={[gregorianSystem]}
      >
        <ActionsHarness />
      </Root>
    );
    fireEvent.press(getByTestId('confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        systemId: 'gregorian',
        date: expect.any(Date),
      })
    );
  });

  it('confirm fires onConfirm with start/end in range mode', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <Root
        initialEnd={new Date(2024, 4, 20)}
        initialStart={new Date(2024, 4, 15)}
        mode="range"
        onConfirm={onConfirm}
        systems={[gregorianSystem]}
      >
        <ActionsHarness />
      </Root>
    );
    fireEvent.press(getByTestId('confirm'));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        systemId: 'gregorian',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      })
    );
  });

  it('confirm passes undefined date fields when nothing is selected', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <Root onConfirm={onConfirm} systems={[gregorianSystem]}>
        <ActionsHarness />
      </Root>
    );
    fireEvent.press(getByTestId('confirm'));
    expect(onConfirm).toHaveBeenCalledWith({
      systemId: 'gregorian',
      date: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  });

  it('confirm is a no-op when onConfirm is not provided', () => {
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <ActionsHarness />
      </Root>
    );
    expect(() => fireEvent.press(getByTestId('confirm'))).not.toThrow();
  });

  it('clear wipes the selection and fires onClear', () => {
    const onClear = jest.fn();
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        onClear={onClear}
        systems={[gregorianSystem]}
      >
        <ActionsHarness />
      </Root>
    );
    expect(getByTestId('canConfirm').props.children).toBe('yes');
    fireEvent.press(getByTestId('clear'));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(getByTestId('canConfirm').props.children).toBe('no');
  });

  it('clear is safe when onClear was not provided', () => {
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <ActionsHarness />
      </Root>
    );
    expect(() => fireEvent.press(getByTestId('clear'))).not.toThrow();
    expect(getByTestId('canConfirm').props.children).toBe('no');
  });
});

// ===========================================================================
// useCalendarNavigation
// ===========================================================================

describe('useCalendarNavigation', () => {
  // Tiny harness exposing goPrev/goNext as buttons + a peek into the
  // current displayed value, so each test can press and observe.
  const NavHarness = () => {
    const { goPrev, goNext } = useCalendarNavigation();
    return (
      <>
        <Pressable onPress={goPrev} testID="prev">
          <Text>prev</Text>
        </Pressable>
        <Pressable onPress={goNext} testID="next">
          <Text>next</Text>
        </Pressable>
      </>
    );
  };

  afterEach(() => {
    // Some tests below mutate I18nManager.isRTL — reset so the global
    // RN flag does not leak across the suite.
    Object.defineProperty(I18nManager, 'isRTL', {
      configurable: true,
      value: false,
    });
  });

  it('throws when used outside <Calendar.Root>', () => {
    expect(() =>
      render(<Capture run={() => useCalendarNavigation()} />)
    ).toThrow(/<Calendar.Root>/);
  });

  it('day view: goPrev steps back one month, goNext steps forward', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    const Probe = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <Probe />
        <NavHarness />
      </Root>
    );
    fireEvent.press(getByTestId('prev'));
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2024, m: 3 })
    );
    fireEvent.press(getByTestId('next'));
    fireEvent.press(getByTestId('next'));
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2024, m: 5 })
    );
  });

  it('month view: goPrev/goNext step the year', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    const Probe = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <Probe />
        <NavHarness />
      </Root>
    );
    act(() => {
      storeRef!.setView('month');
    });
    fireEvent.press(getByTestId('next'));
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2025 })
    );
    fireEvent.press(getByTestId('prev'));
    fireEvent.press(getByTestId('prev'));
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2023 })
    );
  });

  it('year view: goPrev/goNext page by YEAR_PAGE_SIZE years', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    const Probe = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <Probe />
        <NavHarness />
      </Root>
    );
    act(() => {
      storeRef!.setView('year');
    });
    fireEvent.press(getByTestId('next'));
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2024 + 12 })
    );
    fireEvent.press(getByTestId('prev'));
    fireEvent.press(getByTestId('prev'));
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2024 - 12 })
    );
  });

  it('inverts step direction in RTL', () => {
    Object.defineProperty(I18nManager, 'isRTL', {
      configurable: true,
      value: true,
    });
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    const Probe = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <Probe />
        <NavHarness />
      </Root>
    );
    // In RTL, the prev arrow visually points right and should advance.
    fireEvent.press(getByTestId('prev'));
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2024, m: 5 })
    );
    fireEvent.press(getByTestId('next'));
    fireEvent.press(getByTestId('next'));
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ y: 2024, m: 3 })
    );
  });
});

// ===========================================================================
// useCalendarMonthLabel
// ===========================================================================

describe('useCalendarMonthLabel', () => {
  const MonthLabelHarness = () => {
    const { label, isVisible, toggle } = useCalendarMonthLabel();
    return (
      <>
        <Text testID="visible">{isVisible ? 'yes' : 'no'}</Text>
        {isVisible && <Text testID="label">{label}</Text>}
        <Pressable onPress={toggle} testID="toggle">
          <Text>toggle</Text>
        </Pressable>
      </>
    );
  };

  it('throws when used outside <Calendar.Root>', () => {
    expect(() =>
      render(<Capture run={() => useCalendarMonthLabel()} />)
    ).toThrow(/<Calendar.Root>/);
  });

  it('returns the localised month name', () => {
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <MonthLabelHarness />
      </Root>
    );
    expect(getByTestId('label').props.children).toBe('May');
  });

  it('falls back to an empty string when the system returns no label', () => {
    const sys = { ...gregorianSystem, monthLabels: () => ['Jan'] };
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[sys]}>
        <MonthLabelHarness />
      </Root>
    );
    expect(getByTestId('label').props.children).toBe('');
  });

  it('toggle swaps between day and month views', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    const Probe = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <Probe />
        <MonthLabelHarness />
      </Root>
    );
    fireEvent.press(getByTestId('toggle'));
    expect(storeRef!.getSnapshot().view).toBe('month');
    fireEvent.press(getByTestId('toggle'));
    expect(storeRef!.getSnapshot().view).toBe('day');
  });

  it('isVisible flips to false in the year view', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    const Probe = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId, queryByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <Probe />
        <MonthLabelHarness />
      </Root>
    );
    act(() => {
      storeRef!.setView('year');
    });
    expect(getByTestId('visible').props.children).toBe('no');
    expect(queryByTestId('label')).toBeNull();
  });
});

// ===========================================================================
// useCalendarYearLabel
// ===========================================================================

describe('useCalendarYearLabel', () => {
  const YearLabelHarness = () => {
    const { label, toggle } = useCalendarYearLabel();
    return (
      <>
        <Text testID="label">{label}</Text>
        <Pressable onPress={toggle} testID="toggle">
          <Text>toggle</Text>
        </Pressable>
      </>
    );
  };

  it('throws when used outside <Calendar.Root>', () => {
    expect(() =>
      render(<Capture run={() => useCalendarYearLabel()} />)
    ).toThrow(/<Calendar.Root>/);
  });

  it('returns the displayed year as a string in day view', () => {
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <YearLabelHarness />
      </Root>
    );
    expect(getByTestId('label').props.children).toBe('2024');
  });

  it('returns the inclusive page span in year view', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    const Probe = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <Probe />
        <YearLabelHarness />
      </Root>
    );
    act(() => {
      storeRef!.setView('year');
    });
    expect(getByTestId('label').props.children).toBe('2016 - 2027');
  });

  it('toggle swaps between day and year views', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    const Probe = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <Probe />
        <YearLabelHarness />
      </Root>
    );
    fireEvent.press(getByTestId('toggle'));
    expect(storeRef!.getSnapshot().view).toBe('year');
    fireEvent.press(getByTestId('toggle'));
    expect(storeRef!.getSnapshot().view).toBe('day');
  });
});

// ===========================================================================
// useCalendarSystemSwitcher
// ===========================================================================

describe('useCalendarSystemSwitcher', () => {
  const SwitcherHarness = ({
    onCapture,
  }: {
    onCapture?: (setActive: (id: string) => void) => void;
  }) => {
    const { systems, activeId, setActive } = useCalendarSystemSwitcher();
    onCapture?.(setActive);
    return (
      <>
        <Text testID="active">{activeId}</Text>
        <Text testID="count">{String(systems.length)}</Text>
        {systems.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => setActive(s.id)}
            testID={`pill-${s.id}`}
          >
            <Text>{s.label}</Text>
          </Pressable>
        ))}
      </>
    );
  };

  it('throws when used outside <Calendar.Root>', () => {
    expect(() =>
      render(<Capture run={() => useCalendarSystemSwitcher()} />)
    ).toThrow(/<Calendar.Root>/);
  });

  it('returns the configured systems and active id', () => {
    const second = makeSystem('mock-hijri', 'Hijri');
    const { getByTestId } = render(
      <Root systems={[gregorianSystem, second]}>
        <SwitcherHarness />
      </Root>
    );
    expect(getByTestId('active').props.children).toBe('gregorian');
    expect(getByTestId('count').props.children).toBe('2');
  });

  it('setActive switches the active system and fires onSystemChange', () => {
    const second = makeSystem('mock-hijri', 'Hijri');
    const onSystemChange = jest.fn();
    const { getByTestId } = render(
      <Root onSystemChange={onSystemChange} systems={[gregorianSystem, second]}>
        <SwitcherHarness />
      </Root>
    );
    fireEvent.press(getByTestId('pill-mock-hijri'));
    expect(getByTestId('active').props.children).toBe('mock-hijri');
    expect(onSystemChange).toHaveBeenCalledWith('mock-hijri');
  });

  it('ignores setActive calls for unknown ids', () => {
    const second = makeSystem('mock-hijri', 'Hijri');
    const onSystemChange = jest.fn();
    let setActiveRef: ((id: string) => void) | null = null;
    render(
      <Root onSystemChange={onSystemChange} systems={[gregorianSystem, second]}>
        <SwitcherHarness
          onCapture={(setActive) => {
            setActiveRef = setActive;
          }}
        />
      </Root>
    );
    setActiveRef!('does-not-exist');
    expect(onSystemChange).not.toHaveBeenCalled();
  });

  it('exposes a single-system list (consumer chooses to hide it)', () => {
    const { getByTestId } = render(
      <Root systems={[gregorianSystem]}>
        <SwitcherHarness />
      </Root>
    );
    expect(getByTestId('count').props.children).toBe('1');
  });
});

// ===========================================================================
// useCalendarMonthPicker
// ===========================================================================

describe('useCalendarMonthPicker', () => {
  const MonthPickerHarness = () => {
    const { months, activeMonth, selectMonth } = useCalendarMonthPicker();
    return (
      <>
        <Text testID="active">{String(activeMonth)}</Text>
        <Text testID="count">{String(months.length)}</Text>
        {months.map((m) => (
          <Pressable
            key={m.index}
            onPress={() => selectMonth(m.index)}
            testID={`m-${m.index}`}
          >
            <Text>{m.label}</Text>
          </Pressable>
        ))}
      </>
    );
  };

  it('throws when used outside <Calendar.Root>', () => {
    expect(() =>
      render(<Capture run={() => useCalendarMonthPicker()} />)
    ).toThrow(/<Calendar.Root>/);
  });

  it('returns 12 months and marks the active one', () => {
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <MonthPickerHarness />
      </Root>
    );
    expect(getByTestId('count').props.children).toBe('12');
    expect(getByTestId('active').props.children).toBe('4');
  });

  it('selectMonth jumps to that month and switches back to day view', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    const Probe = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <Probe />
        <MonthPickerHarness />
      </Root>
    );
    act(() => {
      storeRef!.setView('month');
    });
    fireEvent.press(getByTestId('m-8'));
    const s = storeRef!.getSnapshot();
    expect(s.view).toBe('day');
    expect(s.displayed).toEqual(expect.objectContaining({ m: 8 }));
  });
});

// ===========================================================================
// useCalendarYearPicker
// ===========================================================================

describe('useCalendarYearPicker', () => {
  const YearPickerHarness = () => {
    const { years, activeYear, selectYear } = useCalendarYearPicker();
    return (
      <>
        <Text testID="active">{String(activeYear)}</Text>
        <Text testID="count">{String(years.length)}</Text>
        {years.map((y) => (
          <Pressable key={y} onPress={() => selectYear(y)} testID={`y-${y}`}>
            <Text>{String(y)}</Text>
          </Pressable>
        ))}
      </>
    );
  };

  it('throws when used outside <Calendar.Root>', () => {
    expect(() =>
      render(<Capture run={() => useCalendarYearPicker()} />)
    ).toThrow(/<Calendar.Root>/);
  });

  it('returns the 12-year window containing the active year', () => {
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <YearPickerHarness />
      </Root>
    );
    expect(getByTestId('count').props.children).toBe('12');
    expect(getByTestId('active').props.children).toBe('2024');
    // The page containing 2024 starts at 2016.
    expect(getByTestId('y-2016')).toBeTruthy();
    expect(getByTestId('y-2027')).toBeTruthy();
  });

  it('selectYear jumps to the chosen year and switches back to day view', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    const Probe = () => {
      storeRef = useCalendarStore();
      return null;
    };
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <Probe />
        <YearPickerHarness />
      </Root>
    );
    act(() => {
      storeRef!.setView('year');
    });
    fireEvent.press(getByTestId('y-2026'));
    const s = storeRef!.getSnapshot();
    expect(s.view).toBe('day');
    expect(s.displayed).toEqual(expect.objectContaining({ y: 2026 }));
  });
});
