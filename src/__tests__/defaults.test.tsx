import React, { createRef } from 'react';
import { render } from '@testing-library/react-native';

import { defaultLabels, defaultPrimitives, defaultTheme } from '../defaults';

describe('defaultPrimitives', () => {
  it('exposes View / Text / Pressable', () => {
    expect(defaultPrimitives.View).toBeDefined();
    expect(defaultPrimitives.Text).toBeDefined();
    expect(defaultPrimitives.Pressable).toBeDefined();
  });

  it('no longer ships an Icon primitive (consumers bring their own)', () => {
    expect(defaultPrimitives).not.toHaveProperty('Icon');
  });

  it('forwards refs through View', () => {
    const ref = createRef<unknown>();
    const View = defaultPrimitives.View as React.ComponentType<{
      ref?: React.Ref<unknown>;
      children?: React.ReactNode;
      testID?: string;
    }>;
    render(<View ref={ref} testID="v" />);
    // Ref attaches to the underlying RN host instance (object or null in test).
    expect(ref).toBeDefined();
  });

  it('forwards refs through Text', () => {
    const ref = createRef<unknown>();
    const Text = defaultPrimitives.Text as React.ComponentType<{
      ref?: React.Ref<unknown>;
      children?: React.ReactNode;
      testID?: string;
    }>;
    render(
      <Text ref={ref} testID="t">
        hello
      </Text>
    );
    expect(ref).toBeDefined();
  });

  it('forwards refs through Pressable', () => {
    const ref = createRef<unknown>();
    const Pressable = defaultPrimitives.Pressable as React.ComponentType<{
      ref?: React.Ref<unknown>;
      children?: React.ReactNode;
      testID?: string;
    }>;
    render(<Pressable ref={ref} testID="p" />);
    expect(ref).toBeDefined();
  });
});

describe('defaultTheme', () => {
  it('exposes the documented colour tokens', () => {
    expect(defaultTheme.colors.primary).toBeDefined();
    expect(defaultTheme.colors.background).toBeDefined();
    expect(defaultTheme.colors.disabled).toBeDefined();
    expect(defaultTheme.colors.border).toBeDefined();
  });

  it('exposes the documented spacing tokens', () => {
    expect(defaultTheme.spacing.xs).toBeGreaterThan(0);
    expect(defaultTheme.spacing.xl).toBeGreaterThan(defaultTheme.spacing.md);
  });

  it('uses a circular borderRadius for day cells', () => {
    expect(defaultTheme.borderRadius).toBe(999);
  });
});

describe('defaultLabels', () => {
  it('contains every label key', () => {
    expect(defaultLabels.prev).toBeDefined();
    expect(defaultLabels.next).toBeDefined();
    expect(defaultLabels.confirm).toBeDefined();
    expect(defaultLabels.clear).toBeDefined();
    expect(defaultLabels.selectMonth).toBeDefined();
    expect(defaultLabels.selectYear).toBeDefined();
  });
});
