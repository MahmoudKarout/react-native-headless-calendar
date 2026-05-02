/**
 * Calendar.SystemSwitcher — toggle between configured calendar systems.
 *
 * Two ways to use it:
 *
 *   1. Default segmented-control look:
 *
 *      <Calendar.SystemSwitcher />
 *
 *   2. Render-prop for full control. You receive the full systems list,
 *      the active id, and a setter — render whatever UI fits your design:
 *
 *      <Calendar.SystemSwitcher>
 *        {({ systems, activeId, setActive }) => (
 *          <MyTabs>
 *            {systems.map((s) => (
 *              <MyTab
 *                key={s.id}
 *                active={s.id === activeId}
 *                onPress={() => setActive(s.id)}
 *                label={s.label}
 *              />
 *            ))}
 *          </MyTabs>
 *        )}
 *      </Calendar.SystemSwitcher>
 *
 * Hidden automatically when only one system is configured.
 */
import React, { memo, useCallback, type ReactNode } from 'react';

import {
  useCalendarConfig,
  useCalendarPrimitives,
  useCalendarSelector,
  useCalendarStore,
  useCalendarTheme,
} from '../context';
import type { CalendarSystem } from '../types';

export interface SystemSwitcherRenderProps {
  systems: readonly CalendarSystem[];
  activeId: string;
  setActive: (systemId: string) => void;
}

export interface SystemSwitcherProps {
  children?: (props: SystemSwitcherRenderProps) => ReactNode;
}

const SystemSwitcherComponent: React.FC<SystemSwitcherProps> = ({
  children,
}) => {
  const { View, Pressable, Text } = useCalendarPrimitives();
  const theme = useCalendarTheme();
  const { systems, onSystemChange, testID } = useCalendarConfig();
  const store = useCalendarStore();

  const activeId = useCalendarSelector((s) => s.system.id);

  const setActive = useCallback(
    (systemId: string) => {
      const idx = systems.findIndex((s) => s.id === systemId);
      const next = idx >= 0 ? systems[idx] : undefined;
      if (!next || idx < 0) return;
      store.replaceSystem(next, idx);
      onSystemChange?.(systemId);
    },
    [store, systems, onSystemChange]
  );

  if (systems.length < 2) return null;

  if (children) {
    return <>{children({ systems, activeId, setActive })}</>;
  }

  // Default look: pill-style segmented control.
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.border,
        borderRadius: theme.borderRadius,
        padding: theme.spacing.xs,
      }}
      testID={testID ? `${testID}.calendar.systemSwitcher` : undefined}
    >
      {systems.map((s) => {
        const isActive = s.id === activeId;
        return (
          <Pressable
            accessibilityLabel={s.label}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            key={s.id}
            onPress={() => setActive(s.id)}
            style={{
              flex: 1,
              paddingVertical: theme.spacing.sm,
              alignItems: 'center',
              borderRadius: theme.borderRadius,
              backgroundColor: isActive
                ? theme.colors.background
                : 'transparent',
            }}
            testID={
              testID ? `${testID}.calendar.systemSwitcher.${s.id}` : undefined
            }
          >
            <Text
              style={{
                color: isActive ? theme.colors.primary : theme.colors.text,
                fontSize: theme.fontSize.day,
                fontWeight: isActive ? '600' : '500',
              }}
            >
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export const SystemSwitcher = memo(SystemSwitcherComponent);
SystemSwitcher.displayName = 'Calendar.SystemSwitcher';
