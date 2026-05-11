import { useState, useMemo } from 'react';
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

  const goToToday = () => setCurrentDate(new Date());
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
                  {MONTH_NAMES[monthDate.getMonth()]} {monthDate.getFullYear()}
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
                  ).map((date) => {
                    if (date.getMonth() !== monthDate.getMonth()) {
                      return (
                        <div
                          key={date.toISOString()}
                          className={`${styles.day} ${styles.outsideMonth}`}
                        />
                      );
                    }
                    return renderDayCell(date, monthDate.getMonth());
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {showFooter && hasSelection && (
          <div className={styles.footer}>
            <div className={styles.selectionInfo}>{getSelectionText()}</div>
            <div className={styles.actions}>
              <button className={styles.clearButton} onClick={clearSelection}>
                Clear
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
