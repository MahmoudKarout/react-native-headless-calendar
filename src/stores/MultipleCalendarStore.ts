/**
 * MultipleCalendarStore — external store for multi-day selection.
 */
import type {
  CalendarDateValue,
  CalendarSystem,
  DateParts,
} from '../types';
import {
  BaseCalendarStore,
  type BaseCalendarSnapshotShared,
  type BaseCalendarStoreOptions,
  normalizeSharedInputs,
  resolveInitialSystem,
} from './BaseCalendarStore';
import type { BaseDayCellFields, CalendarDaysView } from './storeTypes';

export interface MultipleSelectionPayload {
  dates: readonly Date[];
  parts: readonly DateParts[];
  systemId: string;
}

export type MultipleOnConfirm = (payload: MultipleSelectionPayload) => void;
export type MultipleOnClear = () => void;
export type MultipleOnChange = (payload: MultipleSelectionPayload) => void;

export interface MultipleDayCellInfo<T = CalendarDateValue>
  extends BaseDayCellFields<T> {
  isSelected: boolean;
}

export type MultipleCalendarDays<T = CalendarDateValue> =
  CalendarDaysView<MultipleDayCellInfo<T>>;

export interface MultipleCalendarSnapshot<T = CalendarDateValue>
  extends BaseCalendarSnapshotShared<T> {
  readonly mode: 'multiple';
  selectedDates: readonly T[];
  maxSelected: number | undefined;
  days: MultipleCalendarDays<T>;
}

export interface MultipleCalendarStoreOptions<T = CalendarDateValue>
  extends BaseCalendarStoreOptions<T> {
  initialDates?: readonly unknown[];
  maxSelected?: number;
  onConfirm?: MultipleOnConfirm;
  onClear?: MultipleOnClear;
  onChange?: MultipleOnChange;
}

export class MultipleCalendarStore<
  T = CalendarDateValue,
> extends BaseCalendarStore<T, MultipleCalendarSnapshot<T>> {
  private onConfirmCb: MultipleOnConfirm | undefined;
  private onClearCb: MultipleOnClear | undefined;
  private onChangeCb: MultipleOnChange | undefined;
  private cellCache = new Map<number, MultipleDayCellInfo<T>>();
  private initialized = false;

  constructor(opts: MultipleCalendarStoreOptions<T>) {
    super();
    this.configure(opts);
  }

  configure(opts: MultipleCalendarStoreOptions<T>): void {
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

  private bootstrap(opts: MultipleCalendarStoreOptions<T>): void {
    this.systems = opts.systems;
    const { system, systemIndex } = resolveInitialSystem(opts);
    const seedDate = opts.initialDates?.[0];
    const displayed = seedDate ? system.from(seedDate) : system.today();
    const shared = normalizeSharedInputs(opts, system);

    const initialDates = opts.initialDates?.length
      ? opts.initialDates.map((d) => system.from(d))
      : [];

    const body: Omit<
      MultipleCalendarSnapshot<T>,
      'days' | 'months' | 'years'
    > = {
      mode: 'multiple',
      system,
      systemIndex,
      displayed,
      view: 'day',
      selectedDates: initialDates,
      maxSelected: opts.maxSelected,
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
    const next = this.carrySharedSystemFields(s, nextSystem, nextSystemIndex);
    this.commit({
      ...next,
      selectedDates: s.selectedDates.map((d) =>
        nextSystem.fromNativeDate(prevSystem.toNativeDate(d))
      ),
    });
  }

  private reconcileSharedProps(opts: MultipleCalendarStoreOptions<T>): void {
    let next = this.applySharedProps(this.snapshot, opts);
    if (opts.maxSelected !== next.maxSelected) {
      next = { ...next, maxSelected: opts.maxSelected };
    }
    if (next !== this.snapshot) this.commit(next);
  }

  selectDate = (input: unknown): void => {
    const s = this.snapshot;
    const system = s.system;
    const date = system.from(input);

    if (this.isDateDisabled(date)) return;

    const idx = s.selectedDates.findIndex((d) => system.isSame(d, date));
    let nextDates: readonly T[];
    if (idx >= 0) {
      nextDates = [
        ...s.selectedDates.slice(0, idx),
        ...s.selectedDates.slice(idx + 1),
      ];
    } else {
      if (
        s.maxSelected !== undefined &&
        s.selectedDates.length >= s.maxSelected
      ) {
        return;
      }
      nextDates = [...s.selectedDates, date];
    }
    this.commit({
      ...s,
      selectedDates: nextDates,
      displayed: date,
    });
    this.notifyChange();
  };

  clear = (): void => {
    const s = this.snapshot;
    const hadSelection = s.selectedDates.length > 0;
    this.commit({ ...s, selectedDates: [] });
    this.onClearCb?.();
    if (hadSelection) this.notifyChange();
  };

  confirm = (): void => {
    if (!this.onConfirmCb) return;
    this.onConfirmCb(this.buildPayload());
  };

  isConfirmable = (): boolean => this.snapshot.selectedDates.length > 0;

  private buildPayload(): MultipleSelectionPayload {
    const s = this.snapshot;
    return {
      dates: s.selectedDates.map((d) => s.system.toNativeDate(d)),
      parts: s.selectedDates.map((d) => ({
        year: s.system.year(d),
        month: s.system.month(d),
        day: s.system.day(d),
      })),
      systemId: s.system.id,
    };
  }

  private notifyChange(): void {
    if (!this.onChangeCb) return;
    this.onChangeCb(this.buildPayload());
  }

  protected daysInputsChanged(
    a: MultipleCalendarSnapshot<T>,
    b: MultipleCalendarSnapshot<T>
  ): boolean {
    return (
      a.system !== b.system ||
      a.displayed !== b.displayed ||
      a.firstDayOfWeek !== b.firstDayOfWeek ||
      a.modifiers !== b.modifiers ||
      a.selectedDates !== b.selectedDates ||
      a.minDate !== b.minDate ||
      a.maxDate !== b.maxDate ||
      a.disabledDates !== b.disabledDates ||
      a.disabledRanges !== b.disabledRanges ||
      a.disabled !== b.disabled
    );
  }

  protected buildDays(
    s: Omit<MultipleCalendarSnapshot<T>, 'days' | 'months' | 'years'>
  ): MultipleCalendarDays<T> {
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
        isSelected: s.selectedDates.some((d) => system.isSame(d, c.date)),
        isDisabled,
        modifiers,
      }),
      (a, b) => a.isSelected === b.isSelected
    );
  }
}
