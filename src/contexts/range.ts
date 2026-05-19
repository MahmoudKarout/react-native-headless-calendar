import type {
  RangeCalendarDays,
  RangeCalendarSnapshot,
} from '../stores/RangeCalendarStore';
import { RangeCalendarStore } from '../stores/RangeCalendarStore';
import type { CalendarMonths, CalendarYears } from '../types';
import {
  createCalendarContext,
  mapSharedStoreActions,
} from './createCalendarContext';

const {
  StoreContext: RangeCalendarStoreContext,
  useCalendarSelector: useRangeCalendarSelector,
  useCalendarActions: useRangeCalendarActions,
} = createCalendarContext<
  RangeCalendarStore,
  RangeCalendarSnapshot,
  RangeCalendarActions
>({
  modeLabel: 'range-mode',
  providerName: 'RangeDateProvider',
  mapActions: (store) => mapSharedStoreActions(store),
});

export { RangeCalendarStoreContext, useRangeCalendarSelector };

export const selectRangeCanConfirm = (s: RangeCalendarSnapshot): boolean =>
  !!(s.rangeStart && s.rangeEnd);

export const selectRangeDays = (s: RangeCalendarSnapshot): RangeCalendarDays =>
  s.days;

export const selectRangeMonths = (s: RangeCalendarSnapshot): CalendarMonths =>
  s.months;

export const selectRangeYears = (s: RangeCalendarSnapshot): CalendarYears =>
  s.years;

export type RangeCalendarActions = ReturnType<
  typeof mapSharedStoreActions<RangeCalendarStore>
>;

export { useRangeCalendarActions };
