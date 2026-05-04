// Isolated suite for the `systems/jalali` auto-load failure paths.
//
// Same shape as `hijri.peer.test.ts`: each scenario replaces
// `moment-jalaali` with a different stand-in via `jest.doMock` inside
// `jest.isolateModules`, then re-imports `systems/jalali` to re-run the
// eager `jalaliSystem = createJalaliSystem()` line against the freshly
// mocked converter. The friendly `MISSING_CONVERTER_ERROR` is raised at
// import time — the same surface a missing or malformed install presents
// to consumers.
describe('<systems/jalali> peer dep — `moment-jalaali`', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('throws a friendly install-pointing error when the package is missing', () => {
    jest.isolateModules(() => {
      jest.doMock('moment-jalaali', () => {
        // Surface the same shape Metro / Node use when a require can't
        // resolve a module.
        throw new Error("Cannot find module 'moment-jalaali'");
      });
      expect(() => require('../../systems/jalali')).toThrow(
        /yarn add moment-jalaali/
      );
    });
  });

  it('throws when `moment-jalaali` is loaded but `jConvert` is missing', () => {
    jest.isolateModules(() => {
      jest.doMock('moment-jalaali', () => ({}), { virtual: true });
      expect(() => require('../../systems/jalali')).toThrow(
        /yarn add moment-jalaali/
      );
    });
  });

  it('throws when `moment-jalaali.jConvert` is missing toJalaali', () => {
    jest.isolateModules(() => {
      jest.doMock(
        'moment-jalaali',
        () => ({
          jConvert: {
            toGregorian: () => ({ gy: 0, gm: 0, gd: 0 }),
          },
        }),
        { virtual: true }
      );
      expect(() => require('../../systems/jalali')).toThrow(
        /yarn add moment-jalaali/
      );
    });
  });

  it('throws when `moment-jalaali.jConvert` is missing toGregorian', () => {
    jest.isolateModules(() => {
      jest.doMock(
        'moment-jalaali',
        () => ({
          jConvert: {
            toJalaali: () => ({ jy: 0, jm: 0, jd: 0 }),
          },
        }),
        { virtual: true }
      );
      expect(() => require('../../systems/jalali')).toThrow(
        /yarn add moment-jalaali/
      );
    });
  });

  it('throws when `moment-jalaali` resolves to a primitive (non-object, non-function)', () => {
    // Forces the `mod == null || (typeof !== 'object' && typeof !== 'function')`
    // guard inside `isMomentJalaali` — covers the primitive-rejection branch
    // that the empty-object / partial-shape mocks don't reach.
    jest.isolateModules(() => {
      jest.doMock('moment-jalaali', () => 42, { virtual: true });
      expect(() => require('../../systems/jalali')).toThrow(
        /yarn add moment-jalaali/
      );
    });
  });
});
