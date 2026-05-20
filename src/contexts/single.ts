import type {
  SingleCalendarDays,
  SingleCalendarSnapshot,
} from '../stores/SingleCalendarStore';
import { SingleCalendarStore } from '../stores/SingleCalendarStore';
import type { CalendarMonths, CalendarYears } from '../types';
import {
  createCalendarContext,
  mapSharedStoreActions,
} from './createCalendarContext';

const {
  StoreContext: SingleCalendarStoreContext,
  useCalendarSelector: useSingleCalendarSelector,
  useCalendarActions: useSingleCalendarActions,
} = createCalendarContext<
  SingleCalendarStore,
  SingleCalendarSnapshot,
  SingleCalendarActions
>({
  modeLabel: 'single-mode',
  providerName: 'SingleDateProvider',
  mapActions: (store) => mapSharedStoreActions(store),
});

export { SingleCalendarStoreContext, useSingleCalendarSelector };

export const selectSingleCanConfirm = (s: SingleCalendarSnapshot): boolean =>
  !!s.selectedDate;

export const selectSingleDays = (
  s: SingleCalendarSnapshot
): SingleCalendarDays => s.days;

export const selectSingleMonths = (s: SingleCalendarSnapshot): CalendarMonths =>
  s.months;

export const selectSingleYears = (s: SingleCalendarSnapshot): CalendarYears =>
  s.years;

export type SingleCalendarActions = ReturnType<
  typeof mapSharedStoreActions<SingleCalendarStore>
>;

export { useSingleCalendarActions };
