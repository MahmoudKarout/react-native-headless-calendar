/**
 * Default theme tokens and labels.
 *
 * Everything here is overridable via <Calendar.Root>'s props. The
 * defaults are pure data so the package ships zero opinions about
 * design-system primitives.
 */
import type { CalendarLabels, CalendarTheme } from './types';

// ---------------------------------------------------------------------------
// Default theme — neutral, light. Override via <Calendar.Root theme={...}>.
// ---------------------------------------------------------------------------

export const defaultTheme: CalendarTheme = {
  colors: {
    background: '#FFFFFF',
    primary: '#1F6FEB',
    onPrimary: '#FFFFFF',
    text: '#0A0A0A',
    textMuted: '#6B7280',
    todayBorder: '#1F6FEB',
    rangeBackground: '#DBEAFE',
    disabled: '#D1D5DB',
    border: '#E5E7EB',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  cellSize: 40,
  borderRadius: 999,
  fontSize: {
    day: 14,
    weekday: 12,
    header: 16,
  },
};

// ---------------------------------------------------------------------------
// Default labels — English. Override via <Calendar.Root labels={...}>.
// ---------------------------------------------------------------------------

export const defaultLabels: CalendarLabels = {
  prev: 'Previous',
  next: 'Next',
  confirm: 'Confirm',
  clear: 'Clear',
  selectMonth: 'Select month',
  selectYear: 'Select year',
};
