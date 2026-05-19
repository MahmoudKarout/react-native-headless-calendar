/**
 * RangeCalendarStore — external store for date-range selection.
 */
import type {
  CalendarDateValue,
  CalendarSystem,
  DateParts,
} from '../types';
import { isBetween } from '../utils/grid';
import {
  BaseCalendarStore,
  type BaseCalendarSnapshotShared,
  type BaseCalendarStoreOptions,
  normalizeSharedInputs,
  resolveInitialSystem,
} from './BaseCalendarStore';
import type { BaseDayCellFields, CalendarDaysView } from './storeTypes';

export interface RangeSelectionPayload {
  startDate: Date | undefined;
  endDate: Date | undefined;
  startParts: DateParts | undefined;
  endParts: DateParts | undefined;
  systemId: string;
}

export type RangeOnConfirm = (payload: RangeSelectionPayload) => void;
export type RangeOnClear = () => void;
export type RangeOnChange = (payload: RangeSelectionPayload) => void;

export interface RangeDayCellInfo<T = CalendarDateValue>
  extends BaseDayCellFields<T> {
  inRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
}

export type RangeCalendarDays<T = CalendarDateValue> =
  CalendarDaysView<RangeDayCellInfo<T>>;

export interface RangeCalendarSnapshot<T = CalendarDateValue>
  extends BaseCalendarSnapshotShared<T> {
  readonly mode: 'range';
  rangeStart: T | undefined;
  rangeEnd: T | undefined;
  allowSameDay: boolean;
  minRangeDays: number | undefined;
  maxRangeDays: number | undefined;
  days: RangeCalendarDays<T>;
}

export interface RangeCalendarStoreOptions<T = CalendarDateValue>
  extends BaseCalendarStoreOptions<T> {
  initialStart?: unknown;
  initialEnd?: unknown;
  allowSameDay?: boolean;
  minRangeDays?: number;
  maxRangeDays?: number;
  onConfirm?: RangeOnConfirm;
  onClear?: RangeOnClear;
  onChange?: RangeOnChange;
}

export class RangeCalendarStore<T = CalendarDateValue> extends BaseCalendarStore<
  T,
  RangeCalendarSnapshot<T>
> {
  private onConfirmCb: RangeOnConfirm | undefined;
  private onClearCb: RangeOnClear | undefined;
  private onChangeCb: RangeOnChange | undefined;
  private cellCache = new Map<number, RangeDayCellInfo<T>>();
  private initialized = false;

  constructor(opts: RangeCalendarStoreOptions<T>) {
    super();
    this.configure(opts);
  }

  configure(opts: RangeCalendarStoreOptions<T>): void {
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

  private bootstrap(opts: RangeCalendarStoreOptions<T>): void {
    this.systems = opts.systems;
    const { system, systemIndex } = resolveInitialSystem(opts);
    const seedDate = opts.initialStart ?? opts.initialEnd;
    const displayed = seedDate ? system.from(seedDate) : system.today();
    const shared = normalizeSharedInputs(opts, system);

    const body: Omit<RangeCalendarSnapshot<T>, 'days' | 'months' | 'years'> = {
      mode: 'range',
      system,
      systemIndex,
      displayed,
      view: 'day',
      rangeStart: opts.initialStart
        ? system.from(opts.initialStart)
        : undefined,
      rangeEnd: opts.initialEnd ? system.from(opts.initialEnd) : undefined,
      allowSameDay: opts.allowSameDay ?? false,
      minRangeDays: opts.minRangeDays,
      maxRangeDays: opts.maxRangeDays,
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
    if (s.system === nextSystem && s.systemIndex === nextSystemIndex) return;
    const prevSystem = s.system;
    const carry = (v: T | undefined): T | undefined =>
      v ? nextSystem.fromNativeDate(prevSystem.toNativeDate(v)) : undefined;
    const next = this.carrySharedSystemFields(s, nextSystem, nextSystemIndex);
    this.commit({
      ...next,
      rangeStart: carry(s.rangeStart),
      rangeEnd: carry(s.rangeEnd),
    });
  }

  private reconcileSharedProps(opts: RangeCalendarStoreOptions<T>): void {
    let next = this.applySharedProps(this.snapshot, opts);
    if ((opts.allowSameDay ?? false) !== next.allowSameDay) {
      next = { ...next, allowSameDay: opts.allowSameDay ?? false };
    }
    if (opts.minRangeDays !== next.minRangeDays) {
      next = { ...next, minRangeDays: opts.minRangeDays };
    }
    if (opts.maxRangeDays !== next.maxRangeDays) {
      next = { ...next, maxRangeDays: opts.maxRangeDays };
    }
    if (next !== this.snapshot) this.commit(next);
  }

  selectDate = (input: unknown): void => {
    const s = this.snapshot;
    const system = s.system;
    const date = system.from(input);

    if (this.isDateDisabled(date)) return;

    const start = s.rangeStart;
    const end = s.rangeEnd;
    let nextStart = start;
    let nextEnd = end;

    if (!start && !end) {
      nextStart = date;
      nextEnd = undefined;
    } else if (start && !end) {
      if (system.isSame(start, date)) {
        nextStart = s.allowSameDay ? start : undefined;
        nextEnd = s.allowSameDay ? date : undefined;
      } else if (system.isBefore(date, start)) {
        nextStart = date;
        nextEnd = start;
      } else {
        nextStart = start;
        nextEnd = date;
      }
    } else if (!start && end) {
      if (system.isSame(end, date)) {
        nextStart = s.allowSameDay ? date : undefined;
        nextEnd = s.allowSameDay ? end : undefined;
      } else if (system.isBefore(date, end)) {
        nextStart = date;
        nextEnd = end;
      } else {
        nextStart = end;
        nextEnd = date;
      }
    } else {
      nextStart = date;
      nextEnd = undefined;
    }

    if (
      nextStart &&
      nextEnd &&
      !this.isRangeLengthAllowed(nextStart, nextEnd)
    ) {
      return;
    }

    this.commit({
      ...s,
      rangeStart: nextStart,
      rangeEnd: nextEnd,
      displayed: date,
    });
    this.notifyChange();
  };

  clear = (): void => {
    const s = this.snapshot;
    const hadSelection = !!s.rangeStart || !!s.rangeEnd;
    this.commit({ ...s, rangeStart: undefined, rangeEnd: undefined });
    this.onClearCb?.();
    if (hadSelection) this.notifyChange();
  };

  confirm = (): void => {
    if (!this.onConfirmCb) return;
    this.onConfirmCb(this.buildPayload());
  };

  isConfirmable = (): boolean => {
    const s = this.snapshot;
    return !!(s.rangeStart && s.rangeEnd);
  };

  private buildPayload(): RangeSelectionPayload {
    const s = this.snapshot;
    const toParts = (d: T): DateParts => ({
      year: s.system.year(d),
      month: s.system.month(d),
      day: s.system.day(d),
    });
    return {
      startDate: s.rangeStart
        ? s.system.toNativeDate(s.rangeStart)
        : undefined,
      endDate: s.rangeEnd ? s.system.toNativeDate(s.rangeEnd) : undefined,
      startParts: s.rangeStart ? toParts(s.rangeStart) : undefined,
      endParts: s.rangeEnd ? toParts(s.rangeEnd) : undefined,
      systemId: s.system.id,
    };
  }

  private notifyChange(): void {
    if (!this.onChangeCb) return;
    this.onChangeCb(this.buildPayload());
  }

  protected daysInputsChanged(
    a: RangeCalendarSnapshot<T>,
    b: RangeCalendarSnapshot<T>
  ): boolean {
    return (
      a.system !== b.system ||
      a.displayed !== b.displayed ||
      a.firstDayOfWeek !== b.firstDayOfWeek ||
      a.modifiers !== b.modifiers ||
      a.rangeStart !== b.rangeStart ||
      a.rangeEnd !== b.rangeEnd ||
      a.minDate !== b.minDate ||
      a.maxDate !== b.maxDate ||
      a.disabledDates !== b.disabledDates ||
      a.disabledRanges !== b.disabledRanges ||
      a.disabled !== b.disabled
    );
  }

  protected buildDays(
    s: Omit<RangeCalendarSnapshot<T>, 'days' | 'months' | 'years'>
  ): RangeCalendarDays<T> {
    const { system } = s;
    const today = system.today();
    return this.buildDaysFromGrid(
      s,
      this.cellCache,
      (c, nativeDate, isDisabled, modifiers) => {
        const isStart = !!s.rangeStart && system.isSame(c.date, s.rangeStart);
        const isEnd = !!s.rangeEnd && system.isSame(c.date, s.rangeEnd);
        const inRange = isBetween(system, c.date, s.rangeStart, s.rangeEnd);
        return {
          date: c.date,
          nativeDate,
          label: system.formatDay(c.date),
          isCurrentMonth: c.isCurrentMonth,
          isToday: system.isSame(c.date, today),
          inRange: inRange && !isStart && !isEnd,
          isRangeStart: isStart,
          isRangeEnd: isEnd,
          isDisabled,
          modifiers,
        };
      },
      (a, b) =>
        a.inRange === b.inRange &&
        a.isRangeStart === b.isRangeStart &&
        a.isRangeEnd === b.isRangeEnd
    );
  }

  private isRangeLengthAllowed(start: T, end: T): boolean {
    const { minRangeDays, maxRangeDays } = this.snapshot;
    if (minRangeDays === undefined && maxRangeDays === undefined) return true;
    const len = this.rangeLengthDays(start, end);
    if (minRangeDays !== undefined && len < minRangeDays) return false;
    if (maxRangeDays !== undefined && len > maxRangeDays) return false;
    return true;
  }

  private rangeLengthDays(start: T, end: T): number {
    const system = this.snapshot.system;
    const a = system.toNativeDate(start);
    const b = system.toNativeDate(end);
    const aUtc = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const bUtc = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    const ms = Math.abs(bUtc - aUtc);
    return Math.round(ms / 86_400_000) + 1;
  }
}
