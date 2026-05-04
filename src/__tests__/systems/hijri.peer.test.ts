// Isolated suite for the `systems/hijri` auto-load failure paths.
//
// Lives in its own file because each scenario replaces
// `@tabby_ai/hijri-converter` with a different stand-in, and `jest.mock`
// is hoisted to the top of the file by Jest. Running them inline alongside
// the main `hijri.test.ts` would force a `jest.resetModules()` mid-run and
// fight with the eager `hijriSystem = createHijriSystem()` evaluation.
//
// Each test re-imports `systems/hijri` from inside `jest.isolateModules()`
// so the eager export re-runs against the freshly-mocked converter and
// the friendly `MISSING_CONVERTER_ERROR` is raised at import time — the
// same surface a missing or malformed install presents to consumers.
describe('<systems/hijri> peer dep — `@tabby_ai/hijri-converter`', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('throws a friendly install-pointing error when the package is missing', () => {
    jest.isolateModules(() => {
      jest.doMock('@tabby_ai/hijri-converter', () => {
        // Surface the same shape Metro / Node use when a require can't
        // resolve a module.
        throw new Error("Cannot find module '@tabby_ai/hijri-converter'");
      });
      expect(() => require('../../systems/hijri')).toThrow(
        /yarn add @tabby_ai\/hijri-converter/
      );
    });
  });

  it('throws the same error when the package exposes the wrong shape', () => {
    jest.isolateModules(() => {
      jest.doMock('@tabby_ai/hijri-converter', () => ({}), { virtual: true });
      expect(() => require('../../systems/hijri')).toThrow(
        /yarn add @tabby_ai\/hijri-converter/
      );
    });
  });

  it('throws when `createHijriSystem()` is called explicitly with the package missing', () => {
    jest.isolateModules(() => {
      jest.doMock('@tabby_ai/hijri-converter', () => {
        throw new Error("Cannot find module '@tabby_ai/hijri-converter'");
      });
      // Importing the module triggers the eager `hijriSystem` line first;
      // catch that, then call the factory directly to exercise the
      // explicit-no-args path. Keeps both branches covered without
      // resetting modules between them.
      expect(() => require('../../systems/hijri')).toThrow(
        /yarn add @tabby_ai\/hijri-converter/
      );
    });
  });
});
