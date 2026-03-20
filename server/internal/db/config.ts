import { useDb } from './client'
import { nowIso } from './helpers'
import { jsonParse, normalizeMonitorConfig } from './normalize'
import type { MonitorConfig, MonitorConfigPatch } from './types'

export function getMonitorConfig(): MonitorConfig {
  const db = useDb()
  const row = db
    .query('SELECT value FROM app_settings WHERE key = ?')
    .get('monitor_config') as { value: string } | null

  return normalizeMonitorConfig(jsonParse<Partial<MonitorConfig>>(row?.value, {}))
}

export function setMonitorConfig(partial: MonitorConfigPatch) {
  const db = useDb()
  const current = getMonitorConfig()
  const merged = normalizeMonitorConfig({
    ...current,
    ...partial,
    notifier: {
      ...current.notifier,
      ...(partial.notifier || {}),
      webhook: {
        ...current.notifier.webhook,
        ...(partial.notifier?.webhook || {})
      }
    }
  })

  db
    .query(`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `)
    .run('monitor_config', JSON.stringify(merged), nowIso())

  return merged
}
