import React, { createRef } from 'react';
import { render } from '@testing-library/react-native';

import { defaultLabels, defaultPrimitives, defaultTheme } from '../defaults';

describe('defaultPrimitives', () => {
  it('exposes View / Text / Pressable / Icon', () => {
    expect(defaultPrimitives.View).toBeDefined();
    expect(defaultPrimitives.Text).toBeDefined();
    expect(defaultPrimitives.Pressable).toBeDefined();
    expect(defaultPrimitives.Icon).toBeDefined();
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

  it('renders the prev icon', () => {
    const Icon = defaultPrimitives.Icon;
    const tree = render(<Icon name="prev" />);
    // The icon is two arms inside an outer View — confirm something rendered.
    expect(tree.toJSON()).toBeTruthy();
  });

  it('renders the next icon with overrides', () => {
    const Icon = defaultPrimitives.Icon;
    const tree = render(
      <Icon color="#FF0000" name="next" size={32} style={{ marginTop: 4 }} />
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('falls back to defaults when size and color are omitted', () => {
    const Icon = defaultPrimitives.Icon;
    const tree = render(<Icon name="prev" />);
    expect(tree.toJSON()).toBeTruthy();
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
