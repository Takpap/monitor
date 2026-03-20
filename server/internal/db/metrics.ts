import { useDb } from './client'
import { countByQuery, nowIso } from './helpers'
import type { MetricsSnapshot } from './types'

export function getMetricsSnapshot(options?: { ownerId?: string }): MetricsSnapshot {
  const db = useDb()
  const ownerId = options?.ownerId?.trim() || null
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const subscriptionsTotal = ownerId
    ? countByQuery(db, 'SELECT COUNT(1) AS c FROM subscriptions WHERE owner_id = ?', [ownerId])
    : countByQuery(db, 'SELECT COUNT(1) AS c FROM subscriptions', [])

  const subscriptionsEnabled = ownerId
    ? countByQuery(db, 'SELECT COUNT(1) AS c FROM subscriptions WHERE owner_id = ? AND enabled = 1', [ownerId])
    : countByQuery(db, 'SELECT COUNT(1) AS c FROM subscriptions WHERE enabled = 1', [])

  const hitsTotal = ownerId
    ? countByQuery(db, 'SELECT COUNT(1) AS c FROM hits WHERE owner_id = ?', [ownerId])
    : countByQuery(db, 'SELECT COUNT(1) AS c FROM hits', [])

  const hits24h = ownerId
    ? countByQuery(db, 'SELECT COUNT(1) AS c FROM hits WHERE owner_id = ? AND created_at >= ?', [ownerId, dayAgo])
    : countByQuery(db, 'SELECT COUNT(1) AS c FROM hits WHERE created_at >= ?', [dayAgo])

  const deliveryFailed24h = ownerId
    ? countByQuery(
      db,
      "SELECT COUNT(1) AS c FROM deliveries WHERE owner_id = ? AND status = 'failed' AND created_at >= ?",
      [ownerId, dayAgo]
    )
    : countByQuery(db, "SELECT COUNT(1) AS c FROM deliveries WHERE status = 'failed' AND created_at >= ?", [dayAgo])

  return {
    ownerId,
    subscriptionsTotal,
    subscriptionsEnabled,
    hitsTotal,
    hits24h,
    deliveryFailed24h,
    generatedAt: nowIso()
  }
}
