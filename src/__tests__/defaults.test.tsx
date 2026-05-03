import { defaultLabels, defaultTheme } from '../defaults';

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
