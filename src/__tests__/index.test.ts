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
    'Actions',
  ])('exports %s', (name) => {
    expect(publicSurface).toHaveProperty(name);
    expect((publicSurface as Record<string, unknown>)[name]).toBeDefined();
  });
});

describe('public surface — hooks', () => {
  it.each([
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
  it('contains the eight compound parts as static members', () => {
    expect(Object.keys(Calendar).sort()).toEqual(
      [
        'Actions',
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

  it('Header has Root / PrevButton / NextButton / MonthLabel / YearLabel as statics', () => {
    expect(Calendar.Header.Root).toBeDefined();
    expect(Calendar.Header.PrevButton).toBeDefined();
    expect(Calendar.Header.NextButton).toBeDefined();
    expect(Calendar.Header.MonthLabel).toBeDefined();
    expect(Calendar.Header.YearLabel).toBeDefined();
  });

  it('Actions has ConfirmButton / ClearButton as statics', () => {
    expect(Calendar.Actions.ConfirmButton).toBeDefined();
    expect(Calendar.Actions.ClearButton).toBeDefined();
  });
});
