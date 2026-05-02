import * as publicSurface from '../index';
import { Calendar } from '../Calendar';

describe('public surface — components', () => {
  it.each([
    'Calendar',
    'Root',
    'Header',
    'View',
    'DayCell',
    'DayGrid',
    'MonthGrid',
    'YearGrid',
    'SystemSwitcher',
  ])('exports %s', (name) => {
    expect(publicSurface).toHaveProperty(name);
    expect((publicSurface as Record<string, unknown>)[name]).toBeDefined();
  });

  it('does not export the removed <Actions /> component', () => {
    expect(publicSurface).not.toHaveProperty('Actions');
  });
});

describe('public surface — hooks', () => {
  it.each([
    'useCalendarActions',
    'useCalendarConfig',
    'useCalendarLabels',
    'useCalendarPrimitives',
    'useCalendarSelector',
    'useCalendarStore',
    'useCalendarTheme',
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
    'defaultPrimitives',
    'defaultTheme',
    'ROWS',
    'COLS',
    'TOTAL_CELLS',
    'YEAR_PAGE_SIZE',
    'buildMonthGrid',
    'getYearPage',
    'isBetween',
    'isExplicitlyDisabled',
  ])('exports %s', (name) => {
    expect(publicSurface).toHaveProperty(name);
  });
});

describe('Calendar namespace', () => {
  it('contains the compound parts as static members', () => {
    expect(Object.keys(Calendar).sort()).toEqual(
      [
        'DayCell',
        'DayGrid',
        'Header',
        'MonthGrid',
        'Root',
        'SystemSwitcher',
        'View',
        'YearGrid',
      ].sort()
    );
  });

  it('does not expose Actions on the Calendar namespace', () => {
    expect(Calendar).not.toHaveProperty('Actions');
  });

  it('Header has Root / PrevButton / NextButton / MonthLabel / YearLabel as statics', () => {
    expect(Calendar.Header.Root).toBeDefined();
    expect(Calendar.Header.PrevButton).toBeDefined();
    expect(Calendar.Header.NextButton).toBeDefined();
    expect(Calendar.Header.MonthLabel).toBeDefined();
    expect(Calendar.Header.YearLabel).toBeDefined();
  });
});
