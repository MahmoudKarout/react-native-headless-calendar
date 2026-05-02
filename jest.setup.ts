// Pin the test timezone to UTC so `Date.toISOString()`-based testIDs in
// component tests stay deterministic regardless of the host machine.
//
// Used as Jest's `globalSetup` so the variable is in process.env *before*
// the worker boots — `Date` snapshots TZ at process start.
export default function globalSetup(): void {
  process.env.TZ = 'UTC';
}
