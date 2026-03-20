import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { Database } from 'bun:sqlite'
import { initSchema } from './schema'

function getDbPath() {
  const p = process.env.MONITOR_DB_PATH || './data/monitor.db'
  return resolve(process.cwd(), p)
}

declare global {
  // eslint-disable-next-line no-var
  var __smzdmDb: Database | undefined
}

export function useDb() {
  if (!globalThis.__smzdmDb) {
    const dbPath = getDbPath()
    if (!existsSync(dirname(dbPath))) {
      mkdirSync(dirname(dbPath), { recursive: true })
    }

    const db = new Database(dbPath, { create: true })
    initSchema(db)
    globalThis.__smzdmDb = db
  }

  return globalThis.__smzdmDb
}
