/**
 * RangeCalendarStore — external store for date-range selection.
 */
import type { CalendarDateValue, CalendarSystem, DateParts } from '../types';
import { isBetween } from '../utils/grid';
import {
  BaseCalendarStore,
  type BaseCalendarSnapshotShared,
  type BaseCalendarStoreOptions,
  normalizeSharedInputs,
  resolveInitialSystem,
} from './BaseCalendarStore';
import type { BaseDayCellFields, CalendarDaysView } from './storeTypes';
import { toPayloadDate } from '../utils/payloadDate';

export interface RangeSelectionPayload {
  /** Range start as a Gregorian `Date`, anchored at UTC midnight. */
  gregorianStartDate: Date | undefined;
  /** Range end as a Gregorian `Date`, anchored at UTC midnight. */
  gregorianEndDate: Date | undefined;
  /** Identifier of the active calendar system at the time of selection. */
  systemId: string;
  /** Range endpoints expressed in the active calendar system (month is 0-indexed). */
  system: {
    start: DateParts | undefined;
    end: DateParts | undefined;
  };
}

export type RangeOnConfirm = (payload: RangeSelectionPayload) => void;
export type RangeOnClear = () => void;
export type RangeOnChange = (payload: RangeSelectionPayload) => void;

/**
 * Policy applied when the user (or initial props) would produce a range
 * whose interior contains one or more disabled days.
 *
 * - `reject`  (default) The candidate end is refused. `rangeEnd` stays
 *             undefined; `rangeStart` is preserved so the user can pick
 *             a different end. No `onChange` fires.
 * - `include` The range is accepted verbatim. Cells in the interior keep
 *             their `isDisabled` flag, letting consumer UIs render them
 *             differently. `selectRangeCanConfirm` still returns true —
 *             scope the confirm rules to your own UI if you need to.
 * - `exclude` The end is clamped to the day before the first disabled
 *             day in the interior, producing the largest clean range on
 *             the start side. If the clamp degenerates to a same-day
 *             range and `allowSameDay` is false, `rangeEnd` is dropped
 *             instead.
 *
 * Endpoints (`start`, `end`) are always validated against `isDateDisabled`
 * before this policy runs — a disabled endpoint is never accepted.
 */
export type DisabledInRangeBehavior = 'reject' | 'include' | 'exclude';

export interface RangeDayCellInfo<
  T = CalendarDateValue,
> extends BaseDayCellFields<T> {
  inRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
}

export type RangeCalendarDays<T = CalendarDateValue> = CalendarDaysView<
  RangeDayCellInfo<T>
>;

export interface RangeCalendarSnapshot<
  T = CalendarDateValue,
> extends BaseCalendarSnapshotShared<T> {
  readonly mode: 'range';
  rangeStart: T | undefined;
  rangeEnd: T | undefined;
  allowSameDay: boolean;
  minRangeDays: number | undefined;
  maxRangeDays: number | undefined;
  disabledInRangeBehavior: DisabledInRangeBehavior;
  days: RangeCalendarDays<T>;
}

export interface RangeCalendarStoreOptions<
  T = CalendarDateValue,
> extends BaseCalendarStoreOptions<T> {
  initialStart?: unknown;
  initialEnd?: unknown;
  allowSameDay?: boolean;
  minRangeDays?: number;
  maxRangeDays?: number;
  disabledInRangeBehavior?: DisabledInRangeBehavior;
  onConfirm?: RangeOnConfirm;
  onClear?: RangeOnClear;
  onChange?: RangeOnChange;
}

const DEFAULT_DISABLED_IN_RANGE_BEHAVIOR: DisabledInRangeBehavior = 'reject';

type RangeSnapshotBody<T> = Omit<
  RangeCalendarSnapshot<T>,
  'days' | 'months' | 'years'
>;

export class RangeCalendarStore<
  T = CalendarDateValue,
> extends BaseCalendarStore<T, RangeCalendarSnapshot<T>> {
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
    const allowSameDay = opts.allowSameDay ?? false;
    const disabledInRangeBehavior =
      opts.disabledInRangeBehavior ?? DEFAULT_DISABLED_IN_RANGE_BEHAVIOR;

    let initialStart = opts.initialStart
      ? system.from(opts.initialStart)
      : undefined;
    let initialEnd = opts.initialEnd ? system.from(opts.initialEnd) : undefined;

    // Order the seed pair so downstream interior checks are well-defined.
    if (
      initialStart &&
      initialEnd &&
      system.isBefore(initialEnd, initialStart)
    ) {
      [initialStart, initialEnd] = [initialEnd, initialStart];
    }

    const body: RangeSnapshotBody<T> = {
      mode: 'range',
      system,
      systemIndex,
      displayed,
      view: 'day',
      rangeStart: initialStart,
      rangeEnd: initialEnd,
      allowSameDay,
      minRangeDays: opts.minRangeDays,
      maxRangeDays: opts.maxRangeDays,
      disabledInRangeBehavior,
      ...shared,
    };

    // Apply the disabled-interior policy to the initial pair.
    //
    // `selectDate` rejects an entire candidate selection so the prior
    // snapshot is preserved. At bootstrap there is no "prior" — the
    // sensible fallback for a rejected initial pair is to keep the
    // start (which is valid on its own) and drop the offending end,
    // mirroring the state the user would land in after a refused tap.
    //
    // Endpoint validation against `isDateDisabled` is intentionally
    // not done here — initial seeds are trusted as a best-effort
    // starting state, and consumers may legitimately need to pre-fill
    // disabled endpoints in edge UIs.
    if (initialStart && initialEnd) {
      const sanitized = this.applyDisabledInteriorPolicy(
        body,
        initialStart,
        initialEnd
      );
      if (sanitized.rejected) {
        body.rangeStart = initialStart;
        body.rangeEnd = undefined;
      } else {
        body.rangeStart = sanitized.start;
        body.rangeEnd = sanitized.end;
      }
    }

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
    const nextBehavior =
      opts.disabledInRangeBehavior ?? DEFAULT_DISABLED_IN_RANGE_BEHAVIOR;
    if (nextBehavior !== next.disabledInRangeBehavior) {
      next = { ...next, disabledInRangeBehavior: nextBehavior };
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

    // Apply the disabled-interior policy when both endpoints are set
    // and they straddle at least one day. Same-day ranges have no
    // interior to validate.
    if (nextStart && nextEnd && !system.isSame(nextStart, nextEnd)) {
      const sanitized = this.applyDisabledInteriorPolicy(s, nextStart, nextEnd);
      if (sanitized.rejected) return;
      nextStart = sanitized.start;
      nextEnd = sanitized.end;
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
      gregorianStartDate: s.rangeStart
        ? toPayloadDate(s.system, s.rangeStart)
        : undefined,
      gregorianEndDate: s.rangeEnd
        ? toPayloadDate(s.system, s.rangeEnd)
        : undefined,
      systemId: s.system.id,
      system: {
        start: s.rangeStart ? toParts(s.rangeStart) : undefined,
        end: s.rangeEnd ? toParts(s.rangeEnd) : undefined,
      },
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

  protected buildDays(s: RangeSnapshotBody<T>): RangeCalendarDays<T> {
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

  /**
   * Apply `disabledInRangeBehavior` to a candidate ordered pair. Caller
   * must ensure `start` is before `end` and that they are different
   * days — same-day pairs short-circuit before this runs.
   *
   * Bootstrap callers ignore `rejected` and read `start`/`end` directly
   * (a rejected initial pair simply drops the end). `selectDate` checks
   * `rejected` to early-exit so it can preserve the previous snapshot.
   */
  private applyDisabledInteriorPolicy(
    s: RangeSnapshotBody<T>,
    start: T,
    end: T
  ): { start: T | undefined; end: T | undefined; rejected: boolean } {
    const firstDisabled = this.findFirstDisabledInInterior(s, start, end);
    if (!firstDisabled) {
      return { start, end, rejected: false };
    }
    switch (s.disabledInRangeBehavior) {
      case 'include':
        return { start, end, rejected: false };
      case 'exclude': {
        const clampedEnd = this.dayBefore(s.system, firstDisabled);
        if (s.system.isSame(clampedEnd, start)) {
          return s.allowSameDay
            ? { start, end: clampedEnd, rejected: false }
            : { start, end: undefined, rejected: false };
        }
        return { start, end: clampedEnd, rejected: false };
      }
      case 'reject':
      default:
        return { start: undefined, end: undefined, rejected: true };
    }
  }

  /**
   * Walks strictly between `start` (exclusive) and `end` (exclusive)
   * and returns the first day that fails `isDateDisabled`, or
   * undefined if the interior is clean.
   *
   * Iteration uses native local `Date` day-stepping then re-projects
   * each step through `system.fromNativeDate`. `Date#setDate(d + 1)`
   * is calendar-day-correct across DST transitions, and re-projection
   * keeps the disabled check in the active system's domain.
   */
  private findFirstDisabledInInterior(
    s: RangeSnapshotBody<T>,
    start: T,
    end: T
  ): T | undefined {
    const system = s.system;
    const startN = system.toNativeDate(start);
    const endN = system.toNativeDate(end);
    const cursor = new Date(
      startN.getFullYear(),
      startN.getMonth(),
      startN.getDate() + 1
    );
    const stop = new Date(endN.getFullYear(), endN.getMonth(), endN.getDate());
    while (cursor < stop) {
      const dateT = system.fromNativeDate(cursor);
      if (this.isDateDisabled(dateT, s)) return dateT;
      cursor.setDate(cursor.getDate() + 1);
    }
    return undefined;
  }

  private dayBefore(system: CalendarSystem<T>, d: T): T {
    const n = system.toNativeDate(d);
    const prev = new Date(n.getFullYear(), n.getMonth(), n.getDate() - 1);
    return system.fromNativeDate(prev);
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
