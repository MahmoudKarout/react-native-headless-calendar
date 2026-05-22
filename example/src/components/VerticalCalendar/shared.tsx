import { Text, View } from 'react-native';

interface MinimalSystem<T> {
  today(): T;
  addMonths(d: T, n: number): T;
}

export const COLUMN_WIDTH = 42;
export const ROW_HEIGHT = 42;
export const GRID_WIDTH = COLUMN_WIDTH * 7;
export const CALENDAR_WIDTH = 326;

export const MONTHS_BEFORE = 24;
export const MONTHS_AFTER = 24;
export const INITIAL_SCROLL_INDEX = MONTHS_BEFORE;

export interface MonthDescriptor {
  offset: number;
  key: string;
}

export function buildMonthOffsets(
  before = MONTHS_BEFORE,
  after = MONTHS_AFTER
): MonthDescriptor[] {
  const out: MonthDescriptor[] = [];
  for (let i = -before; i <= after; i += 1) {
    out.push({ offset: i, key: `m_${i}` });
  }
  return out;
}

export function monthDisplayed<T>(system: MinimalSystem<T>, offset: number): T {
  return system.addMonths(system.today(), offset);
}

interface WeekdayHeaderProps {
  labels: readonly string[];
}

export function WeekdayHeader({ labels }: WeekdayHeaderProps) {
  return (
    <View className="flex-row bg-card border-b border-border py-2 items-center justify-center">
      <View className="flex-row" style={{ width: GRID_WIDTH }}>
        {labels.map((label) => (
          <Text
            key={label}
            className="text-muted text-[11px] font-medium tracking-widest text-center uppercase"
            style={{ width: COLUMN_WIDTH }}
          >
            {label.slice(0, 2)}
          </Text>
        ))}
      </View>
    </View>
  );
}

interface MonthLabelProps {
  label: string;
}

export function MonthLabel({ label }: MonthLabelProps) {
  return (
    <View className="items-center pt-4 pb-2" style={{ width: GRID_WIDTH }}>
      <Text className="text-foreground text-base font-semibold">{label}</Text>
    </View>
  );
}
