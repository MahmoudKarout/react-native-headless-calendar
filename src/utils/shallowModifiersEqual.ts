/**
 * Two records of `Record<string, boolean>` are shallowly equal iff they
 * have the same keys with the same boolean values. The cell builder
 * only ever sets `true` for matched modifiers and omits unmatched ones,
 * so a value-mismatch is unreachable through the public API — kept as
 * a defensive check.
 */
export function shallowModifiersEqual(
  a: Record<string, boolean>,
  b: Record<string, boolean>
): boolean {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  /* istanbul ignore next */
  for (const k of ak) if (a[k] !== b[k]) return false;
  return true;
}
