import type { Database } from 'bun:sqlite'

export function nowIso() {
  return new Date().toISOString()
}

export function escapeLike(input: string) {
  return input.replace(/[\\%_]/g, '\\$&')
}

export function countByQuery(db: Database, sql: string, args: Array<string | number>) {
  const row = db.query(sql).get(...args) as { c: number } | null
  return row?.c || 0
}
