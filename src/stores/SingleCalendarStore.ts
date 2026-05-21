/**
 * SingleCalendarStore — external store for single-date selection.
 */
import type { CalendarDateValue, CalendarSystem, DateParts } from '../types';
import {
  BaseCalendarStore,
  type BaseCalendarSnapshotShared,
  type BaseCalendarStoreOptions,
  normalizeSharedInputs,
  resolveInitialSystem,
} from './BaseCalendarStore';
import type { BaseDayCellFields, CalendarDaysView } from './storeTypes';

export interface SingleSelectionPayload {
  date: Date | undefined;
  parts: DateParts | undefined;
  systemId: string;
}

export type SingleOnConfirm = (payload: SingleSelectionPayload) => void;
export type SingleOnClear = () => void;
export type SingleOnChange = (payload: SingleSelectionPayload) => void;

export interface SingleDayCellInfo<
  T = CalendarDateValue,
> extends BaseDayCellFields<T> {
  isSelected: boolean;
}

export type SingleCalendarDays<T = CalendarDateValue> = CalendarDaysView<
  SingleDayCellInfo<T>
>;

export interface SingleCalendarSnapshot<
  T = CalendarDateValue,
> extends BaseCalendarSnapshotShared<T> {
  readonly mode: 'single';
  selectedDate: T | undefined;
  days: SingleCalendarDays<T>;
}

export interface SingleCalendarStoreOptions<
  T = CalendarDateValue,
> extends BaseCalendarStoreOptions<T> {
  initialDate?: unknown;
  onConfirm?: SingleOnConfirm;
  onClear?: SingleOnClear;
  onChange?: SingleOnChange;
}

export class SingleCalendarStore<
  T = CalendarDateValue,
> extends BaseCalendarStore<T, SingleCalendarSnapshot<T>> {
  private onConfirmCb: SingleOnConfirm | undefined;
  private onClearCb: SingleOnClear | undefined;
  private onChangeCb: SingleOnChange | undefined;
  private cellCache = new Map<number, SingleDayCellInfo<T>>();
  private initialized = false;

  constructor(opts: SingleCalendarStoreOptions<T>) {
    super();
    this.configure(opts);
  }

  configure(opts: SingleCalendarStoreOptions<T>): void {
    this.onConfirmCb = opts.onConfirm;
    this.onClearCb = opts.onClear;
    this.onChangeCb = opts.onChange;

    if (!this.initialized) {
      this.bootstrap(opts);
      this.initialized = true;
      return;
    }

    this.batch(() => {
      this.reconcileSystem(opts);
      this.reconcileSharedProps(opts);
    });
  }

  private bootstrap(opts: SingleCalendarStoreOptions<T>): void {
    this.systems = opts.systems;
    const { system, systemIndex } = resolveInitialSystem(opts);
    const displayed = opts.initialDate
      ? system.from(opts.initialDate)
      : system.today();
    const shared = normalizeSharedInputs(opts, system);

    const body: Omit<SingleCalendarSnapshot<T>, 'days' | 'months' | 'years'> = {
      mode: 'single',
      system,
      systemIndex,
      displayed,
      view: 'day',
      selectedDate: opts.initialDate
        ? system.from(opts.initialDate)
        : undefined,
      ...shared,
    };
    this.initSnapshot({
      ...body,
      days: this.buildDays(body),
      months: this.buildMonths(body),
      years: this.buildYears(body),
    });
    this.seedSharedInputs(opts);
  }

  protected replaceSystem(
    nextSystem: CalendarSystem<T>,
    nextSystemIndex: number
  ): void {
    const s = this.snapshot;
    /* istanbul ignore next — defensive guard; public callers never re-enter
     * with the same system+index. */
    if (s.system === nextSystem && s.systemIndex === nextSystemIndex) return;
    const prevSystem = s.system;
    const next = this.carrySharedSystemFields(s, nextSystem, nextSystemIndex);
    this.commit({
      ...next,
      selectedDate: s.selectedDate
        ? nextSystem.fromNativeDate(prevSystem.toNativeDate(s.selectedDate))
        : undefined,
    });
  }

  private reconcileSharedProps(opts: SingleCalendarStoreOptions<T>): void {
    const next = this.applySharedProps(this.snapshot, opts);
    if (next !== this.snapshot) this.commit(next);
  }

  selectDate = (input: unknown): void => {
    const s = this.snapshot;
    const date = s.system.from(input);
    if (this.isDateDisabled(date)) return;
    this.commit({
      ...s,
      selectedDate: date,
      displayed: date,
    });
    this.notifyChange();
  };

  clear = (): void => {
    const s = this.snapshot;
    const hadSelection = !!s.selectedDate;
    this.commit({ ...s, selectedDate: undefined });
    this.onClearCb?.();
    if (hadSelection) this.notifyChange();
  };

  confirm = (): void => {
    if (!this.onConfirmCb) return;
    this.onConfirmCb(this.buildPayload());
  };

  isConfirmable = (): boolean => !!this.snapshot.selectedDate;

  private buildPayload(): SingleSelectionPayload {
    const s = this.snapshot;
    const sel = s.selectedDate;
    return {
      date: sel ? s.system.toNativeDate(sel) : undefined,
      parts: sel
        ? {
            year: s.system.year(sel),
            month: s.system.month(sel),
            day: s.system.day(sel),
          }
        : undefined,
      systemId: s.system.id,
    };
  }

  private notifyChange(): void {
    if (!this.onChangeCb) return;
    this.onChangeCb(this.buildPayload());
  }

  protected daysInputsChanged(
    a: SingleCalendarSnapshot<T>,
    b: SingleCalendarSnapshot<T>
  ): boolean {
    return (
      a.system !== b.system ||
      a.displayed !== b.displayed ||
      a.firstDayOfWeek !== b.firstDayOfWeek ||
      a.modifiers !== b.modifiers ||
      a.selectedDate !== b.selectedDate ||
      a.minDate !== b.minDate ||
      a.maxDate !== b.maxDate ||
      a.disabledDates !== b.disabledDates ||
      a.disabledRanges !== b.disabledRanges ||
      a.disabled !== b.disabled
    );
  }

  protected buildDays(
    s: Omit<SingleCalendarSnapshot<T>, 'days' | 'months' | 'years'>
  ): SingleCalendarDays<T> {
    const { system } = s;
    const today = system.today();
    return this.buildDaysFromGrid(
      s,
      this.cellCache,
      (c, nativeDate, isDisabled, modifiers) => ({
        date: c.date,
        nativeDate,
        label: system.formatDay(c.date),
        isCurrentMonth: c.isCurrentMonth,
        isToday: system.isSame(c.date, today),
        isSelected: !!s.selectedDate && system.isSame(c.date, s.selectedDate),
        isDisabled,
        modifiers,
      }),
      (a, b) => a.isSelected === b.isSelected
    );
  }
}
