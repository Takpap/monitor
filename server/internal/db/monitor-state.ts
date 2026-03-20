import { useDb } from './client'
import { nowIso } from './helpers'

export function isMonitorInitialized() {
  const db = useDb()
  const row = db
    .query('SELECT value FROM monitor_state WHERE key = ?')
    .get('initialized') as { value: string } | null

  return row?.value === '1'
}

export function setMonitorInitialized(value: boolean) {
  const db = useDb()
  db
    .query(`
      INSERT INTO monitor_state (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `)
    .run('initialized', value ? '1' : '0', nowIso())
}

export function getMonitorStatus() {
  const db = useDb()
  const rows = db
    .query('SELECT key, value, updated_at FROM monitor_state WHERE key IN (?, ?, ?, ?)')
    .all('last_run_at', 'last_summary', 'last_error', 'run_phase') as Array<{
    key: string
    value: string
    updated_at: string
  }>

  const map = new Map(rows.map((row) => [row.key, row]))
  return {
    lastRunAt: map.get('last_run_at')?.value || null,
    lastSummary: map.get('last_summary')?.value || null,
    lastError: map.get('last_error')?.value || null,
    runPhase: map.get('run_phase')?.value || null
  }
}

export function setMonitorStatus(input: {
  lastRunAt?: string
  lastSummary?: string
  lastError?: string
  runPhase?: string
}) {
  const db = useDb()
  const entries: Array<[string, string]> = []
  if (input.lastRunAt !== undefined) entries.push(['last_run_at', input.lastRunAt])
  if (input.lastSummary !== undefined) entries.push(['last_summary', input.lastSummary])
  if (input.lastError !== undefined) entries.push(['last_error', input.lastError])
  if (input.runPhase !== undefined) entries.push(['run_phase', input.runPhase])

  const stmt = db.query(`
    INSERT INTO monitor_state (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `)

  for (const [key, value] of entries) {
    stmt.run(key, value, nowIso())
  }
}
