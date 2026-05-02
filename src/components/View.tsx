/**
 * Calendar.View — switches between DayGrid / MonthGrid / YearGrid based on
 * the current store view. Pure convenience for the common case:
 *
 *   <Calendar.View />
 *
 * Equivalent compound form:
 *
 *   const view = useCalendarSelector(s => s.view);
 *   if (view === 'day')   return <Calendar.DayGrid />;
 *   if (view === 'month') return <Calendar.MonthGrid />;
 *   return <Calendar.YearGrid />;
 *
 * If you need a different sub-view (e.g. a decade picker), build your own
 * component that subscribes to `s.view` and renders accordingly.
 */
import React, { memo } from 'react';

import { useCalendarSelector } from '../context';
import { DayGrid, type DayGridProps } from './DayGrid';
import { MonthGrid } from './MonthGrid';
import { YearGrid } from './YearGrid';

const ViewComponent: React.FC<DayGridProps> = ({ renderDay }) => {
  const view = useCalendarSelector((s) => s.view);

  if (view === 'day') return <DayGrid renderDay={renderDay} />;
  if (view === 'month') return <MonthGrid />;
  return <YearGrid />;
};

export const View = memo(ViewComponent);
View.displayName = 'Calendar.View';
