// Isolated suite for the optional `@legendapp/list` peer-dep guard.
//
// Lives in its own file because mocking the peer dep with a throwing
// factory has to apply at module-load time — running it alongside the
// other swipeable tests (which mock `@legendapp/list` with a working
// stand-in) would force a `jest.resetModules()` mid-run and stale-out
// React for every subsequent `render(...)`. Keeping it standalone lets
// the file-scoped `jest.mock` survive the whole run cleanly.
import { render } from '@testing-library/react-native';

import { DayGrid } from '../../components/DayGrid';
import { Root } from '../../components/Root';
import { gregorianSystem } from '../../systems/gregorian';

// Stand the peer dep up as a throwing module — same surface a missing
// install presents at runtime.
jest.mock('@legendapp/list', () => {
  throw new Error("Cannot find module '@legendapp/list'");
});

describe('<Calendar.DayGrid swipeable /> peer-dep guard', () => {
  it('throws a clear, README-pointing error when @legendapp/list is missing', () => {
    // The thrown error bubbles through React's render path; mute the
    // expected console noise so the suite output stays focused.
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    expect(() =>
      render(
        <Root systems={[gregorianSystem]}>
          <DayGrid swipeable />
        </Root>
      )
    ).toThrow(/@legendapp\/list/);
    consoleSpy.mockRestore();
  });
});
