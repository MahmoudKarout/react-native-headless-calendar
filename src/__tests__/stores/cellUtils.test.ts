import { cellsAreEquivalent } from '../../stores/cellUtils';
import type { BaseDayCellFields } from '../../stores/storeTypes';

const baseCell = (overrides: Partial<BaseDayCellFields> = {}): BaseDayCellFields => ({
  date: { y: 2024, m: 4, d: 15 },
  nativeDate: new Date(2024, 4, 15),
  label: '15',
  isCurrentMonth: true,
  isToday: false,
  isDisabled: false,
  modifiers: {},
  ...overrides,
});

describe('cellsAreEquivalent()', () => {
  it('returns true for identical cells without an extraEqual fn', () => {
    expect(cellsAreEquivalent(baseCell(), baseCell())).toBe(true);
  });

  it('returns true when extraEqual is provided and agrees', () => {
    expect(
      cellsAreEquivalent(baseCell(), baseCell(), () => true)
    ).toBe(true);
  });

  it('returns false when label differs', () => {
    expect(cellsAreEquivalent(baseCell(), baseCell({ label: '99' }))).toBe(
      false
    );
  });

  it('returns false when modifiers shape differs', () => {
    expect(
      cellsAreEquivalent(
        baseCell({ modifiers: { a: true } }),
        baseCell({ modifiers: { a: true, b: true } })
      )
    ).toBe(false);
  });

  it('returns false when extraEqual rejects', () => {
    expect(
      cellsAreEquivalent(baseCell(), baseCell(), () => false)
    ).toBe(false);
  });
});
