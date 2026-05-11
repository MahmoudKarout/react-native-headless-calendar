/**
 * PerfCalendarDemo
 *
 * A web-only performance showcase built entirely with React.memo + useRef.
 * Each day cell is an isolated reactive unit. The tiny counter inside every
 * cell shows exactly how many times it has rendered since the month was loaded.
 *
 * How it works:
 *  - 42 PerfDayCell components are mounted once per month.
 *  - Every cell receives only the boolean props it cares about.
 *  - onPress is a single stable callback (stateRef pattern) — never recreated.
 *  - React.memo bails out of re-rendering any cell whose props haven't changed.
 *  - Result: tap a day → only 1–N cells update; the rest stay frozen at 1×.
 */
import { useState, useMemo, useCallback, memo, useRef } from 'react';
import styles from './styles.module.css';

// ─── helpers ──────────────────────────────────────────────────────────────────

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
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const buildCells = (year: number, month: number): Date[] =>
  Array.from({ length: 42 }, (_, i) => {
    const offset = new Date(year, month, 1).getDay();
    return new Date(year, month, i - offset + 1);
  });

// ─── memoised day cell ─────────────────────────────────────────────────────────

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  /** true for the range-start or range-end cell, or the single selected cell */
  isSelected: boolean;
  /** true for days strictly between start and end */
  isInRange: boolean;
  /** true only for the range-start cell once an end is also chosen */
  isRangeStartWithEnd: boolean;
  isRangeEnd: boolean;
  onPress: (date: Date) => void;
}

const PerfDayCell = memo(
  ({
    date,
    isCurrentMonth,
    isToday,
    isSelected,
    isInRange,
    isRangeStartWithEnd,
    isRangeEnd,
    onPress,
  }: DayCellProps) => {
    // Render counter — persists in the ref across re-renders, never resets.
    const count = useRef(0);
    count.current += 1;

    // Wrapper handles the range-fill background that flows edge-to-edge.
    let wrapperCls = styles.dayWrapper;
    if (isInRange) wrapperCls += ` ${styles.rangeMiddle}`;
    if (isRangeStartWithEnd) wrapperCls += ` ${styles.rangeStart}`;
    if (isRangeEnd) wrapperCls += ` ${styles.rangeEnd}`;

    let dayCls = `${styles.day} ${styles.perfDay}`;
    if (!isCurrentMonth) dayCls += ` ${styles.outsideMonth}`;
    if (isSelected) dayCls += ` ${styles.selected}`;
    else if (isToday && !isInRange) dayCls += ` ${styles.today}`;

    const hot = count.current > 1;

    return (
      <div className={wrapperCls}>
        <button
          className={dayCls}
          onClick={() => isCurrentMonth && onPress(date)}
          disabled={!isCurrentMonth}
          aria-label={`${date.getDate()}, rendered ${count.current} times`}
        >
          <span className={styles.perfNum}>{date.getDate()}</span>
          <span
            className={`${styles.perfCount}${hot ? ` ${styles.perfCountHot}` : ''}`}
          >
            {count.current}×
          </span>
        </button>
      </div>
    );
  }
);

PerfDayCell.displayName = 'PerfDayCell';

// ─── main component ────────────────────────────────────────────────────────────

export default function PerfCalendarDemo() {
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  // Incrementing this seed changes all cell keys → forces remount → resets counts.
  const [resetSeed, setResetSeed] = useState(0);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Stable cell array — only rebuilt when the displayed month changes.
  const cells = useMemo(() => buildCells(year, month), [year, month]);

  // Keep latest selection in a ref so onPress never needs to be recreated.
  const selRef = useRef({ rangeStart, rangeEnd });
  selRef.current = { rangeStart, rangeEnd };

  // ── STABLE callback — identity never changes ──────────────────────────────
  const onPress = useCallback((date: Date) => {
    const { rangeStart: start, rangeEnd: end } = selRef.current;
    if (!start || (start && end)) {
      // Start fresh range.
      setRangeStart(date);
      setRangeEnd(null);
    } else {
      // Complete the range, normalising direction.
      const [s, e] = date < start ? [date, start] : [start, date];
      setRangeStart(s);
      setRangeEnd(e);
    }
  }, []);

  const prevMonth = useCallback(
    () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)),
    []
  );
  const nextMonth = useCallback(
    () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)),
    []
  );

  const reset = useCallback(() => {
    setRangeStart(null);
    setRangeEnd(null);
    // Bump seed to remount all cells so render counts start fresh.
    setResetSeed((s) => s + 1);
  }, []);

  const selText =
    rangeStart && rangeEnd
      ? `${rangeStart.toDateString()} → ${rangeEnd.toDateString()}`
      : rangeStart
        ? `${rangeStart.toDateString()} → pick end date`
        : 'Click a day to start a range';

  return (
    <div className={styles.perfContainer}>
      {/* ── header ── */}
      <div className={styles.header}>
        <button
          className={styles.navButton}
          onClick={prevMonth}
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className={styles.monthYear}>
          <span className={styles.month}>{MONTH_NAMES[month]}</span>
          <span className={styles.year}>{year}</span>
        </div>
        <button
          className={styles.navButton}
          onClick={nextMonth}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* ── counter legend ── */}
      <div className={styles.perfHint}>
        <span className={styles.perfHintDim}>1×</span>
        <span className={styles.perfHintSep}> initial render </span>
        <span className={styles.perfHintSep}>·</span>
        <span className={styles.perfHintHot}> 2×+ </span>
        <span className={styles.perfHintSep}> re-rendered</span>
      </div>

      {/* ── weekday labels ── */}
      <div className={styles.weekdays}>
        {WEEKDAY_NAMES.map((d) => (
          <div key={d} className={styles.weekday}>
            {d}
          </div>
        ))}
      </div>

      {/* ── day grid ── */}
      <div className={styles.daysGrid}>
        {cells.map((date) => {
          // Key is stable within a month but changes on month nav or reset.
          const k = `${resetSeed}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          const cm = date.getMonth() === month;

          const sel = Boolean(
            (rangeStart && isSameDay(date, rangeStart)) ||
            (rangeEnd && isSameDay(date, rangeEnd))
          );
          const inR = Boolean(
            rangeStart && rangeEnd && date > rangeStart && date < rangeEnd
          );
          // Show the start-of-range half-gradient only once we have an end.
          const rsWE = Boolean(
            rangeStart && rangeEnd && isSameDay(date, rangeStart)
          );
          const rE = Boolean(
            rangeStart &&
            rangeEnd &&
            !isSameDay(rangeStart, rangeEnd) &&
            isSameDay(date, rangeEnd)
          );

          return (
            <PerfDayCell
              key={k}
              date={date}
              isCurrentMonth={cm}
              isToday={isSameDay(date, today)}
              isSelected={sel}
              isInRange={inR}
              isRangeStartWithEnd={rsWE}
              isRangeEnd={rE}
              onPress={onPress}
            />
          );
        })}
      </div>

      {/* ── footer ── */}
      <div className={styles.footer}>
        <div className={styles.selectionInfo}>{selText}</div>
        <div className={styles.actions}>
          <button className={styles.clearButton} onClick={reset}>
            Reset counters
          </button>
        </div>
      </div>
    </div>
  );
}
