import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import styles from './styles.module.css';

interface Modifier {
  dates?: Date[];
  ranges?: { start: Date; end: Date }[];
  predicate?: (date: Date) => boolean;
}

interface CalendarDemoProps {
  mode?: 'single' | 'range' | 'multiple';
  showFooter?: boolean;
  numberOfMonths?: number;
  showWeekNumbers?: boolean;
  minDate?: Date;
  maxDate?: Date;
  maxSelected?: number;
  minRangeDays?: number;
  maxRangeDays?: number;
  /** disable weekdays by index (0 = Sunday, 6 = Saturday) */
  disabledWeekdays?: number[];
  /** specific dates to disable */
  disabledDates?: Date[];
  /** disabled date ranges */
  disabledRanges?: { start: Date; end: Date }[];
  /** Named modifiers shown as colored dots */
  modifiers?: Record<string, Modifier & { color: string; label: string }>;
  /** "bottomSheet" presents the calendar inside a fake sheet trigger */
  bottomSheet?: boolean;
  /** "vertical" shows months stacked vertically with scroll */
  vertical?: boolean;
  /** custom day cell renderer style ("price", "image", "status", "dots") */
  cellStyle?: 'default' | 'price' | 'status' | 'dots';
  /** initial display date */
  initialDate?: Date;
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** render an iOS-style drum-roll wheel date picker */
  wheel?: boolean;
  /** render a vertical horoscope calendar with zodiac bands */
  horoscope?: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SUNDAY_WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const isSameDay = (d1: Date, d2: Date): boolean =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const isoWeekNumber = (date: Date): number => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

// ─── Wheel Date Picker ───────────────────────────────────────────────────────

const WHEEL_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const ITEM_H = 52;

function wheelDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function buildWheelDays(count: number) {
  return Array.from({ length: count }, (_, i) =>
    String(i + 1).padStart(2, '0')
  );
}

function buildWheelYears(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
}

interface WheelColumnProps {
  items: string[];
  initialIndex: number;
  onIndexChange: (i: number) => void;
  /** Fractional offset (0–1) for scale/opacity of each item as it scrolls */
  scrollFraction?: number;
}

function WheelColumn({ items, initialIndex, onIndexChange }: WheelColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(initialIndex * ITEM_H);
  const rafRef = useRef<number>(0);
  const snapTimerRef = useRef<ReturnType<typeof setTimeout>>(
    null as unknown as ReturnType<typeof setTimeout>
  );

  // Scroll to initial index on mount without animation
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = initialIndex * ITEM_H;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When items shrink (e.g. Feb has fewer days), clamp position
  useEffect(() => {
    const maxScroll = (items.length - 1) * ITEM_H;
    if (ref.current && ref.current.scrollTop > maxScroll) {
      ref.current.scrollTop = maxScroll;
    }
  }, [items.length]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const st = e.currentTarget.scrollTop;

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setScrollTop(st));

      clearTimeout(snapTimerRef.current);
      snapTimerRef.current = setTimeout(() => {
        const idx = Math.max(
          0,
          Math.min(Math.round(st / ITEM_H), items.length - 1)
        );
        onIndexChange(idx);
      }, 120);
    },
    [items.length, onIndexChange]
  );

  return (
    <div ref={ref} className={styles.wheelColumn} onScroll={handleScroll}>
      <div className={styles.wheelPad} />
      {items.map((label, i) => {
        const dist = Math.abs(scrollTop / ITEM_H - i);
        const scale = Math.max(0.72, Math.min(1.14, 1.14 - dist * 0.21));
        const opacity = Math.max(0.18, Math.min(1, 1 - dist * 0.41));
        return (
          <div
            key={label}
            className={styles.wheelItem}
            style={{ transform: `scale(${scale})`, opacity }}
            onClick={() => {
              if (ref.current) {
                ref.current.scrollTo({ top: i * ITEM_H, behavior: 'smooth' });
              }
            }}
          >
            {label}
          </div>
        );
      })}
      <div className={styles.wheelPad} />
    </div>
  );
}

function WheelDatePickerDemo() {
  const now = new Date();
  const MIN_YEAR = now.getFullYear() - 80;
  const MAX_YEAR = now.getFullYear() + 20;

  const [dayIdx, setDayIdx] = useState(now.getDate() - 1);
  const [monthIdx, setMonthIdx] = useState(now.getMonth());
  const [yearIdx, setYearIdx] = useState(now.getFullYear() - MIN_YEAR);

  const years = buildWheelYears(MIN_YEAR, MAX_YEAR);
  const numDays = wheelDaysInMonth(monthIdx, MIN_YEAR + yearIdx);
  const days = buildWheelDays(numDays);

  const clampedDay = Math.min(dayIdx, numDays - 1);

  const selectedDate = new Date(MIN_YEAR + yearIdx, monthIdx, clampedDay + 1);

  const handleDay = useCallback((i: number) => setDayIdx(i), []);

  const handleMonth = useCallback(
    (i: number) => {
      setMonthIdx(i);
      setDayIdx((d) =>
        Math.min(d, wheelDaysInMonth(i, MIN_YEAR + yearIdx) - 1)
      );
    },
    [yearIdx, MIN_YEAR]
  );

  const handleYear = useCallback(
    (i: number) => {
      setYearIdx(i);
      setDayIdx((d) =>
        Math.min(d, wheelDaysInMonth(monthIdx, MIN_YEAR + i) - 1)
      );
    },
    [monthIdx, MIN_YEAR]
  );

  return (
    <div className={styles.wheelWrapper}>
      <div className={styles.wheelPicker}>
        {/* selection indicator */}
        <div className={styles.wheelSelector} />
        <WheelColumn
          items={days}
          initialIndex={clampedDay}
          onIndexChange={handleDay}
        />
        <WheelColumn
          items={WHEEL_MONTHS}
          initialIndex={monthIdx}
          onIndexChange={handleMonth}
        />
        <WheelColumn
          items={years}
          initialIndex={yearIdx}
          onIndexChange={handleYear}
        />
      </div>
      <div className={styles.wheelResult}>
        <div className={styles.wheelResultLabel}>Selected date</div>
        <div className={styles.wheelResultValue}>
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Horoscope Calendar (vertical, zodiac-tinted) ─────────────────────────────

interface ZodiacSign {
  id: string;
  name: string;
  symbol: string;
  start: { month: number; day: number };
}

const ZODIAC: ZodiacSign[] = [
  { id: 'capricorn',   name: 'Capricorn',   symbol: '\u2651', start: { month: 11, day: 22 } },
  { id: 'aquarius',    name: 'Aquarius',    symbol: '\u2652', start: { month: 0,  day: 20 } },
  { id: 'pisces',      name: 'Pisces',      symbol: '\u2653', start: { month: 1,  day: 19 } },
  { id: 'aries',       name: 'Aries',       symbol: '\u2648', start: { month: 2,  day: 21 } },
  { id: 'taurus',      name: 'Taurus',      symbol: '\u2649', start: { month: 3,  day: 20 } },
  { id: 'gemini',      name: 'Gemini',      symbol: '\u264A', start: { month: 4,  day: 21 } },
  { id: 'cancer',      name: 'Cancer',      symbol: '\u264B', start: { month: 5,  day: 21 } },
  { id: 'leo',         name: 'Leo',         symbol: '\u264C', start: { month: 6,  day: 23 } },
  { id: 'virgo',       name: 'Virgo',       symbol: '\u264D', start: { month: 7,  day: 23 } },
  { id: 'libra',       name: 'Libra',       symbol: '\u264E', start: { month: 8,  day: 23 } },
  { id: 'scorpio',     name: 'Scorpio',     symbol: '\u264F', start: { month: 9,  day: 23 } },
  { id: 'sagittarius', name: 'Sagittarius', symbol: '\u2650', start: { month: 10, day: 22 } },
];

const ZODIAC_BY_ID: Record<string, ZodiacSign> = Object.fromEntries(
  ZODIAC.map((s) => [s.id, s])
);

const doy = (d: Date): number =>
  Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000
  );

const signForDate = (d: Date): ZodiacSign => {
  const y = d.getFullYear();
  const t = doy(d);
  for (let i = 1; i < ZODIAC.length; i += 1) {
    const cur = ZODIAC[i];
    const next = ZODIAC[i + 1] ?? ZODIAC[0];
    const curDoy = doy(new Date(y, cur.start.month, cur.start.day));
    const nextDoy =
      next.id === 'capricorn'
        ? doy(new Date(y, 11, 22))
        : doy(new Date(y, next.start.month, next.start.day));
    if (t >= curDoy && t < nextDoy) return cur;
  }
  return ZODIAC_BY_ID.capricorn;
};

/**
 * Memoised per-year start/end boundary maps. A day-of-year hits the
 * `startDoy` map iff it's the *first* day of some sign's band, and the
 * `endDoy` map iff it's the last. Used by `HoroscopeCell` to decide
 * whether to render the corner badge(s).
 */
const BOUNDARY_CACHE = new Map<
  number,
  { startDoy: Map<number, ZodiacSign>; endDoy: Map<number, ZodiacSign> }
>();
const getBoundaries = (year: number) => {
  let cached = BOUNDARY_CACHE.get(year);
  if (!cached) {
    const startDoy = new Map<number, ZodiacSign>();
    const endDoy = new Map<number, ZodiacSign>();
    for (let i = 0; i < ZODIAC.length; i += 1) {
      const sign = ZODIAC[i];
      const next = ZODIAC[(i + 1) % ZODIAC.length];
      startDoy.set(doy(new Date(year, sign.start.month, sign.start.day)), sign);
      const nextStart = new Date(year, next.start.month, next.start.day);
      const endDate = new Date(nextStart);
      endDate.setDate(endDate.getDate() - 1);
      endDoy.set(doy(endDate), sign);
    }
    cached = { startDoy, endDoy };
    BOUNDARY_CACHE.set(year, cached);
  }
  return cached;
};

const rangeLabel = (sign: ZodiacSign): string => {
  const idx = ZODIAC.indexOf(sign);
  const next = ZODIAC[(idx + 1) % ZODIAC.length];
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const start = new Date(2001, sign.start.month, sign.start.day);
  const end = new Date(2001, next.start.month, next.start.day - 1);
  return `${fmt(start)} – ${fmt(end)}`;
};

function HoroscopeCalendarDemo() {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  // `monthsToShow` is generous enough to span a full zodiac cycle.
  const monthsToShow = 6;

  const focused = useMemo(() => {
    if (!focusedKey) return null;
    const [y, m, d] = focusedKey.split('-').map(Number);
    return new Date(y, m, d);
  }, [focusedKey]);

  const focusedSign = focused ? signForDate(focused) : null;

  const startOfMonthYear = today.getFullYear();
  const startOfMonth = today.getMonth();

  return (
    <div className={styles.verticalContainer}>
      <div className={styles.horoscopeHeader}>
        {focused && focusedSign ? (
          <>
            <div
              className={styles.horoscopeHeaderBadge}
              data-sign={focusedSign.id}
            >
              <span>{focusedSign.symbol}</span>
            </div>
            <div className={styles.horoscopeHeaderText}>
              <div className={styles.horoscopeHeaderEyebrow}>
                {focused.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <div className={styles.horoscopeHeaderName}>
                {focusedSign.name}
              </div>
              <div className={styles.horoscopeHeaderRange}>
                {rangeLabel(focusedSign)}
              </div>
            </div>
          </>
        ) : (
          <div className={styles.horoscopeHeaderText}>
            <div className={styles.horoscopeHeaderEyebrow}>Horoscope</div>
            <div className={styles.horoscopeHeaderRange}>
              Tap any day to see its zodiac sign.
            </div>
          </div>
        )}
      </div>

      <div className={styles.verticalScroll}>
        {Array.from({ length: monthsToShow }).map((_, i) => {
          const monthDate = new Date(startOfMonthYear, startOfMonth + i, 1);
          const cells = (() => {
            const firstOfMonth = new Date(
              monthDate.getFullYear(),
              monthDate.getMonth(),
              1
            );
            const offset = firstOfMonth.getDay();
            const arr: Date[] = [];
            for (let j = 0; j < 42; j += 1) {
              arr.push(
                new Date(
                  monthDate.getFullYear(),
                  monthDate.getMonth(),
                  j - offset + 1
                )
              );
            }
            return arr;
          })();

          return (
            <div key={i} className={styles.verticalMonth}>
              <div className={styles.verticalMonthCaption}>
                <span className={styles.verticalMonthCaptionMonth}>
                  {MONTH_NAMES[monthDate.getMonth()]}
                </span>
                <span aria-hidden="true">·</span>
                <span>{monthDate.getFullYear()}</span>
              </div>
              <div className={styles.weekdays}>
                {SUNDAY_WEEKDAY_NAMES.map((d) => (
                  <div key={d} className={styles.weekday}>
                    {d}
                  </div>
                ))}
              </div>
              <div className={styles.daysGrid}>
                {cells.map((date) => {
                  const isCurrentMonth =
                    date.getMonth() === monthDate.getMonth();
                  if (!isCurrentMonth) {
                    return (
                      <div
                        key={date.toISOString()}
                        className={styles.dayWrapper}
                      >
                        <span className={styles.day} />
                      </div>
                    );
                  }
                  const sign = signForDate(date);
                  const t = doy(date);
                  const { startDoy, endDoy } = getBoundaries(date.getFullYear());
                  const startSign = startDoy.get(t) ?? null;
                  const endSign = endDoy.get(t) ?? null;
                  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                  const isFocused = focusedKey === key;
                  return (
                    <div
                      key={date.toISOString()}
                      className={styles.dayWrapper}
                    >
                      <button
                        type="button"
                        onClick={() => setFocusedKey(key)}
                        className={`${styles.day} ${styles.horoscopeDay} ${
                          isFocused ? styles.horoscopeDayFocused : ''
                        }`}
                        data-sign={sign.id}
                      >
                        <span>{date.getDate()}</span>
                        {startSign ? (
                          <span
                            className={`${styles.horoscopeBadge} ${styles.horoscopeBadgeStart}`}
                            data-sign={startSign.id}
                            aria-label={`${startSign.name} starts`}
                          >
                            {startSign.symbol}
                          </span>
                        ) : null}
                        {endSign ? (
                          <span
                            className={`${styles.horoscopeBadge} ${styles.horoscopeBadgeEnd}`}
                            data-sign={endSign.id}
                            aria-label={`${endSign.name} ends`}
                          >
                            {endSign.symbol}
                          </span>
                        ) : null}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CalendarDemo({
  mode = 'single',
  showFooter = true,
  numberOfMonths = 1,
  showWeekNumbers = false,
  minDate,
  maxDate,
  maxSelected,
  minRangeDays,
  maxRangeDays,
  disabledWeekdays,
  disabledDates,
  disabledRanges,
  modifiers,
  bottomSheet = false,
  vertical = false,
  cellStyle = 'default',
  initialDate,
  firstDayOfWeek = 0,
  wheel = false,
  horoscope = false,
}: CalendarDemoProps) {
  const [currentDate, setCurrentDate] = useState(initialDate ?? new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const weekdayNames = useMemo(
    () =>
      SUNDAY_WEEKDAY_NAMES.slice(firstDayOfWeek).concat(
        SUNDAY_WEEKDAY_NAMES.slice(0, firstDayOfWeek)
      ),
    [firstDayOfWeek]
  );

  // All hooks are above this line — safe to return early.
  if (wheel) return <WheelDatePickerDemo />;
  if (horoscope) return <HoroscopeCalendarDemo />;

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < startOfDay(minDate)) return true;
    if (maxDate && date > startOfDay(maxDate)) return true;
    if (disabledWeekdays?.includes(date.getDay())) return true;
    if (disabledDates?.some((d) => isSameDay(d, date))) return true;
    if (
      disabledRanges?.some(
        (r) => date >= startOfDay(r.start) && date <= startOfDay(r.end)
      )
    ) {
      return true;
    }
    return false;
  };

  const isToday = (date: Date) => isSameDay(date, new Date());

  const isSelected = (date: Date): boolean => {
    if (mode === 'single') {
      return selectedDate ? isSameDay(date, selectedDate) : false;
    }
    if (mode === 'range') {
      return Boolean(
        (rangeStart && isSameDay(date, rangeStart)) ||
        (rangeEnd && isSameDay(date, rangeEnd))
      );
    }
    return selectedDates.some((d) => isSameDay(date, d));
  };

  const isInRange = (date: Date): boolean => {
    if (mode !== 'range' || !rangeStart || !rangeEnd) return false;
    return date > rangeStart && date < rangeEnd;
  };

  const isRangeStart = (date: Date): boolean =>
    mode === 'range' && rangeStart != null && rangeEnd != null
      ? isSameDay(date, rangeStart)
      : false;

  const isRangeEnd = (date: Date): boolean =>
    mode === 'range' && rangeStart != null && rangeEnd != null
      ? isSameDay(date, rangeEnd)
      : false;

  const getModifiersForDate = (date: Date): string[] => {
    if (!modifiers) return [];
    const matched: string[] = [];
    for (const [name, mod] of Object.entries(modifiers)) {
      if (mod.dates?.some((d) => isSameDay(d, date))) {
        matched.push(name);
        continue;
      }
      if (
        mod.ranges?.some(
          (r) => date >= startOfDay(r.start) && date <= startOfDay(r.end)
        )
      ) {
        matched.push(name);
        continue;
      }
      if (mod.predicate?.(date)) matched.push(name);
    }
    return matched;
  };

  const getPriceFor = (date: Date): number => {
    const seed = date.getDate() + date.getMonth();
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isHighSeason = date.getMonth() >= 5 && date.getMonth() <= 7;
    return 100 + (seed % 30) + (isWeekend ? 30 : 0) + (isHighSeason ? 50 : 0);
  };

  const getStatusFor = (date: Date): 'available' | 'booked' | 'pending' => {
    const day = date.getDate();
    if (day % 7 === 0) return 'booked';
    if (day % 5 === 0) return 'pending';
    return 'available';
  };

  const handleDateClick = (date: Date) => {
    setErrorMessage(null);
    if (isDateDisabled(date)) return;

    if (mode === 'single') {
      setSelectedDate(date);
      return;
    }

    if (mode === 'multiple') {
      const exists = selectedDates.some((d) => isSameDay(d, date));
      if (exists) {
        setSelectedDates(selectedDates.filter((d) => !isSameDay(d, date)));
      } else {
        if (maxSelected && selectedDates.length >= maxSelected) {
          setErrorMessage(`Maximum ${maxSelected} dates allowed`);
          return;
        }
        setSelectedDates((prev) => [...prev, date]);
      }
      return;
    }

    // range mode
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(date);
      setRangeEnd(null);
      return;
    }

    let nextStart = rangeStart;
    let nextEnd = date;
    if (date < rangeStart) {
      nextStart = date;
      nextEnd = rangeStart;
    }

    const days =
      Math.round((nextEnd.getTime() - nextStart.getTime()) / 86400000) + 1;
    if (minRangeDays && days < minRangeDays) {
      setErrorMessage(`Minimum ${minRangeDays} days required`);
      return;
    }
    if (maxRangeDays && days > maxRangeDays) {
      setErrorMessage(`Maximum ${maxRangeDays} days allowed`);
      return;
    }

    setRangeStart(nextStart);
    setRangeEnd(nextEnd);
  };

  const buildMonthCells = (year: number, month: number): Date[] => {
    const firstOfMonth = new Date(year, month, 1);
    const offset = (firstOfMonth.getDay() - firstDayOfWeek + 7) % 7;
    const cells: Date[] = [];
    for (let i = 0; i < 42; i += 1) {
      cells.push(new Date(year, month, i - offset + 1));
    }
    return cells;
  };

  const renderDayCell = (date: Date, displayedMonth: number) => {
    const isCurrentMonth = date.getMonth() === displayedMonth;
    const disabled = isDateDisabled(date);
    const selected = isSelected(date);
    const inRange = isInRange(date);
    const rangeStartDay = isRangeStart(date);
    const rangeEndDay = isRangeEnd(date);
    const today = isToday(date);
    const dateModifiers = getModifiersForDate(date);

    let wrapperClass = styles.dayWrapper;
    if (inRange) wrapperClass += ` ${styles.rangeMiddle}`;
    if (rangeStartDay && rangeEnd) wrapperClass += ` ${styles.rangeStart}`;
    if (rangeEndDay && rangeStart && !isSameDay(rangeStart, rangeEnd!)) {
      wrapperClass += ` ${styles.rangeEnd}`;
    }

    let dayClass = styles.day;
    if (!isCurrentMonth) dayClass += ` ${styles.outsideMonth}`;
    if (disabled) dayClass += ` ${styles.disabled}`;
    if (selected) dayClass += ` ${styles.selected}`;
    if (today && !selected && !inRange) dayClass += ` ${styles.today}`;

    if (cellStyle === 'price' && isCurrentMonth && !disabled) {
      return (
        <div key={date.toISOString()} className={wrapperClass}>
          <button
            className={`${dayClass} ${styles.priceCell}`}
            onClick={() => handleDateClick(date)}
            disabled={disabled}
          >
            <span className={styles.priceDay}>{date.getDate()}</span>
            <span className={styles.priceValue}>${getPriceFor(date)}</span>
          </button>
        </div>
      );
    }

    if (cellStyle === 'status' && isCurrentMonth) {
      const status = getStatusFor(date);
      const statusColors = {
        available: '#22c55e',
        booked: '#ef4444',
        pending: '#f59e0b',
      };
      return (
        <div key={date.toISOString()} className={wrapperClass}>
          <button
            className={`${dayClass} ${styles.statusCell}`}
            onClick={() => handleDateClick(date)}
            disabled={status === 'booked'}
            style={{ borderLeftColor: statusColors[status] }}
          >
            <span>{date.getDate()}</span>
            <span className={styles.statusLabel}>{status}</span>
          </button>
        </div>
      );
    }

    return (
      <div key={date.toISOString()} className={wrapperClass}>
        <button
          className={dayClass}
          onClick={() => handleDateClick(date)}
          disabled={disabled || !isCurrentMonth}
        >
          <span>{date.getDate()}</span>
          {dateModifiers.length > 0 && (
            <span className={styles.modifierDots}>
              {dateModifiers.map((name) => (
                <span
                  key={name}
                  className={styles.dot}
                  style={{ backgroundColor: modifiers?.[name]?.color }}
                  title={modifiers?.[name]?.label}
                />
              ))}
            </span>
          )}
        </button>
      </div>
    );
  };

  const renderMonth = (offset: number) => {
    const monthDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + offset,
      1
    );
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const cells = buildMonthCells(year, month);

    return (
      <div key={`${year}-${month}`} className={styles.monthBlock}>
        {numberOfMonths > 1 && (
          <div className={styles.monthCaption}>
            {MONTH_NAMES[month]} {year}
          </div>
        )}

        <div
          className={`${styles.weekdays} ${
            showWeekNumbers ? styles.weekdaysWithNumbers : ''
          }`}
        >
          {showWeekNumbers && <div className={styles.weekNumberHeader}>Wk</div>}
          {weekdayNames.map((d) => (
            <div key={d} className={styles.weekday}>
              {d}
            </div>
          ))}
        </div>

        {showWeekNumbers ? (
          <div className={styles.daysGridWithWeeks}>
            {Array.from({ length: 6 }).map((_, rowIdx) => {
              const rowCells = cells.slice(rowIdx * 7, rowIdx * 7 + 7);
              const thursdayIdx = (4 - firstDayOfWeek + 7) % 7;
              const thursday = rowCells[thursdayIdx] ?? rowCells[0]!;
              return (
                <div key={rowIdx} className={styles.weekRow}>
                  <div className={styles.weekNumber}>
                    {isoWeekNumber(thursday)}
                  </div>
                  <div className={styles.weekRowDays}>
                    {rowCells.map((date) => renderDayCell(date, month))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.daysGrid}>
            {cells.map((date) => renderDayCell(date, month))}
          </div>
        )}
      </div>
    );
  };

  const clearSelection = () => {
    setSelectedDate(null);
    setRangeStart(null);
    setRangeEnd(null);
    setSelectedDates([]);
    setErrorMessage(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);

    // Also select today's date based on the current mode
    if (mode === 'single') {
      setSelectedDate(today);
    } else if (mode === 'range') {
      // In range mode, set today as the start date
      setRangeStart(today);
      setRangeEnd(null);
    } else if (mode === 'multiple') {
      // In multiple mode, add today to selection (or toggle it)
      const exists = selectedDates.some((d) => isSameDay(d, today));
      if (!exists) {
        setSelectedDates((prev) => [...prev, today]);
      }
    }
    setErrorMessage(null);
  };
  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );

  const getSelectionText = () => {
    if (mode === 'single') {
      return selectedDate ? selectedDate.toDateString() : 'No date selected';
    }
    if (mode === 'range') {
      if (rangeStart && rangeEnd) {
        const nights = Math.round(
          (rangeEnd.getTime() - rangeStart.getTime()) / 86400000
        );
        return `${rangeStart.toDateString()} → ${rangeEnd.toDateString()} (${nights} nights)`;
      }
      if (rangeStart) return `${rangeStart.toDateString()} → Select end date`;
      return 'Select start date';
    }
    const count = selectedDates.length;
    return maxSelected
      ? `${count} of ${maxSelected} selected`
      : `${count} selected`;
  };

  const hasSelection =
    (mode === 'single' && selectedDate) ||
    (mode === 'range' && rangeStart) ||
    (mode === 'multiple' && selectedDates.length > 0);

  // Bottom sheet variant: render trigger button that opens an overlay
  if (bottomSheet && !sheetOpen) {
    return (
      <div className={styles.sheetTriggerWrapper}>
        <button
          className={styles.sheetTriggerInput}
          onClick={() => setSheetOpen(true)}
        >
          <span className={styles.sheetTriggerLabel}>Select a date</span>
          <span className={styles.sheetTriggerIcon}>📅</span>
        </button>
        {hasSelection && (
          <p className={styles.sheetTriggerHelper}>
            Last selection: {getSelectionText()}
          </p>
        )}
      </div>
    );
  }

  const calendarBody = (
    <>
      <div className={styles.header}>
        <button className={styles.navButton} onClick={prevMonth}>
          ‹
        </button>
        <div className={styles.monthYear}>
          <span className={styles.month}>
            {MONTH_NAMES[currentDate.getMonth()]}
          </span>
          <span className={styles.year}>{currentDate.getFullYear()}</span>
        </div>
        <button className={styles.navButton} onClick={nextMonth}>
          ›
        </button>
      </div>

      <div
        className={
          numberOfMonths > 1 ? styles.multiMonthRow : styles.singleMonth
        }
      >
        {Array.from({ length: numberOfMonths }).map((_, i) => renderMonth(i))}
      </div>

      {showFooter && (
        <div className={styles.footer}>
          <div className={styles.selectionInfo}>
            {errorMessage ? (
              <span className={styles.errorText}>{errorMessage}</span>
            ) : (
              getSelectionText()
            )}
          </div>
          <div className={styles.actions}>
            <button className={styles.clearButton} onClick={clearSelection}>
              Clear
            </button>
            <button className={styles.todayButton} onClick={goToToday}>
              Today
            </button>
            {bottomSheet && (
              <button
                className={styles.confirmButton}
                onClick={() => setSheetOpen(false)}
                disabled={!hasSelection}
              >
                Confirm selection
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );

  if (vertical) {
    const monthsToShow = 4;
    return (
      <div className={styles.verticalContainer}>
        <div className={styles.verticalScroll}>
          {Array.from({ length: monthsToShow }).map((_, i) => {
            const monthDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth() + i,
              1
            );
            return (
              <div key={i} className={styles.verticalMonth}>
                <div className={styles.verticalMonthCaption}>
                  <span className={styles.verticalMonthCaptionMonth}>
                    {MONTH_NAMES[monthDate.getMonth()]}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{monthDate.getFullYear()}</span>
                </div>
                <div className={styles.weekdays}>
                  {weekdayNames.map((d) => (
                    <div key={d} className={styles.weekday}>
                      {d}
                    </div>
                  ))}
                </div>
                <div className={styles.daysGrid}>
                  {buildMonthCells(
                    monthDate.getFullYear(),
                    monthDate.getMonth()
                  ).map((date) =>
                    renderDayCell(date, monthDate.getMonth())
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {showFooter && (
          <div className={styles.footer}>
            <div className={styles.selectionInfo}>
              {hasSelection ? getSelectionText() : 'No date selected'}
            </div>
            <div className={styles.actions}>
              <button className={styles.clearButton} onClick={clearSelection}>
                Clear
              </button>
              <button className={styles.todayButton} onClick={goToToday}>
                Today
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (bottomSheet) {
    return (
      <div className={styles.sheetOverlay}>
        <div className={styles.sheetContainer}>
          <div className={styles.sheetHandle} />
          <div className={styles.calendarContainer}>{calendarBody}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.calendarContainer} ${
        numberOfMonths > 1 ? styles.calendarWide : ''
      } ${
        cellStyle === 'price' || cellStyle === 'status'
          ? styles.calendarWideCells
          : ''
      }`}
    >
      {calendarBody}

      {modifiers && (
        <div className={styles.legend}>
          {Object.entries(modifiers).map(([name, mod]) => (
            <div key={name} className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ backgroundColor: mod.color }}
              />
              <span>{mod.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
