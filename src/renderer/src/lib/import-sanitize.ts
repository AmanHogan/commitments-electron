/**
 * Converts a record from an imported JSON file into a shape that is safe to
 * send through Electron IPC and bind into SQLite.
 *
 * The DB's `normalize()` helper converts SQLite 0/1 integers to real JS
 * booleans on the way OUT (export). better-sqlite3 rejects those booleans on
 * the way BACK IN — even though the DB layer calls `boolInt()`, the type
 * error fires before the conversion can run.  Pre-converting here ensures
 * only valid SQLite binding types (number, string, null) cross the IPC
 * boundary.
 */
export function sanitizeForDb(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'boolean') {
      out[k] = v ? 1 : 0
    } else if (v === undefined) {
      out[k] = null
    } else {
      out[k] = v
    }
  }
  return out
}
