import type {
  MultipleCalendarDays,
  MultipleCalendarSnapshot,
} from '../stores/MultipleCalendarStore';
import { MultipleCalendarStore } from '../stores/MultipleCalendarStore';
import type { CalendarMonths, CalendarYears } from '../types';
import {
  createCalendarContext,
  mapSharedStoreActions,
} from './createCalendarContext';

const {
  StoreContext: MultipleCalendarStoreContext,
  useCalendarSelector: useMultipleCalendarSelector,
  useCalendarActions: useMultipleCalendarActions,
} = createCalendarContext<
  MultipleCalendarStore,
  MultipleCalendarSnapshot,
  MultipleCalendarActions
>({
  modeLabel: 'multiple-mode',
  providerName: 'MultipleDateProvider',
  mapActions: (store) => mapSharedStoreActions(store),
});

export { MultipleCalendarStoreContext, useMultipleCalendarSelector };

export const selectMultipleCanConfirm = (
  s: MultipleCalendarSnapshot
): boolean => s.selectedDates.length > 0;

export const selectMultipleDays = (
  s: MultipleCalendarSnapshot
): MultipleCalendarDays => s.days;

export const selectMultipleMonths = (
  s: MultipleCalendarSnapshot
): CalendarMonths => s.months;

export const selectMultipleYears = (
  s: MultipleCalendarSnapshot
): CalendarYears => s.years;

export type MultipleCalendarActions = ReturnType<
  typeof mapSharedStoreActions<MultipleCalendarStore>
>;

export { useMultipleCalendarActions };
