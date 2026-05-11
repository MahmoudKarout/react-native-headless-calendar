import * as publicSurface from '../index';
import { Calendar } from '../Calendar';

// ---------------------------------------------------------------------------
// Components — only `<Calendar.Root>` and `<Calendar.DayGrid>` (plus the
// individually exported `<DayCell>`) ship as renderable components. Every
// other piece of UI the calendar used to ship has been replaced with a
// hook so the consumer brings their own design.
// ---------------------------------------------------------------------------

describe('public surface — components', () => {
  it.each(['Calendar', 'Root', 'DayCell', 'DayGrid'])('exports %s', (name) => {
    expect(publicSurface).toHaveProperty(name);
    expect((publicSurface as Record<string, unknown>)[name]).toBeDefined();
  });

  it.each(['Header', 'View', 'MonthGrid', 'YearGrid', 'SystemSwitcher'])(
    'no longer exports the removed %s component',
    (name) => {
      expect(publicSurface).not.toHaveProperty(name);
    }
  );

  it('does not export the removed <Actions /> component', () => {
    expect(publicSurface).not.toHaveProperty('Actions');
  });
});

// ---------------------------------------------------------------------------
// Hooks — every former component is now a `useCalendar*` hook.
// ---------------------------------------------------------------------------

describe('public surface — hooks', () => {
  it.each([
    'useCalendarActions',
    'useCalendarComponents',
    'useCalendarConfig',
    'useCalendarFirstDayOfWeek',
    'useCalendarLabels',
    'useCalendarMonthLabel',
    'useCalendarMonthPicker',
    'useCalendarNavigation',
    'useCalendarSelectedDates',
    'useCalendarSelector',
    'useCalendarStore',
    'useCalendarSystemSwitcher',
    'useCalendarTheme',
    'useCalendarWeekNumbers',
    'useCalendarWeekdayLabels',
    'useCalendarYearLabel',
    'useCalendarYearPicker',
  ])('exports %s', (name) => {
    expect(publicSurface).toHaveProperty(name);
    expect(typeof (publicSurface as Record<string, unknown>)[name]).toBe(
      'function'
    );
  });
});

describe('public surface — defaults & utilities', () => {
  it.each([
    'defaultLabels',
    'defaultTheme',
    'ROWS',
    'COLS',
    'TOTAL_CELLS',
    'YEAR_PAGE_SIZE',
    'DEFAULT_FIRST_DAY_OF_WEEK',
    'buildMonthGrid',
    'getYearPage',
    'isBetween',
    'isExplicitlyDisabled',
    'isoWeekNumber',
    'matchDate',
    'rotateWeekdayLabels',
    'usedRows',
  ])('exports %s', (name) => {
    expect(publicSurface).toHaveProperty(name);
  });

  it('does not export the removed defaultPrimitives', () => {
    expect(publicSurface).not.toHaveProperty('defaultPrimitives');
  });
});

// ---------------------------------------------------------------------------
// Calendar namespace — only the two stable rendered components live on it.
// ---------------------------------------------------------------------------

describe('Calendar namespace', () => {
  it('contains exactly Root, DayGrid, DayCell, and SwipeableDayGrid', () => {
    expect(Object.keys(Calendar).sort()).toEqual(
      ['DayCell', 'DayGrid', 'Root', 'SwipeableDayGrid'].sort()
    );
  });

  it.each(['Header', 'View', 'MonthGrid', 'YearGrid', 'SystemSwitcher'])(
    'does not expose the removed %s on the Calendar namespace',
    (name) => {
      expect(Calendar).not.toHaveProperty(name);
    }
  );

  it('does not expose Actions on the Calendar namespace', () => {
    expect(Calendar).not.toHaveProperty('Actions');
  });
});
