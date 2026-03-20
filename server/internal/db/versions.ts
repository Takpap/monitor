import { useDb } from './client'
import { nowIso } from './helpers'
import {
  normalizeSubscriptionRow,
  normalizeSubscriptionSnapshot,
  normalizeSubscriptionVersionRow,
} from './normalize'
import { addSubscriptionVersionRecord } from './version-log'

export function listSubscriptionVersions(options: {
  subscriptionId: number
  ownerId?: string
  limit?: number
}) {
  const db = useDb()
  const limit = Math.min(Math.max(options.limit || 30, 1), 200)
  const ownerId = options.ownerId?.trim()

  const rows = ownerId
    ? (
      db
        .query(`
          SELECT id, subscription_id, owner_id, action, snapshot, created_at
          FROM subscription_versions
          WHERE subscription_id = ? AND owner_id = ?
          ORDER BY id DESC
          LIMIT ?
        `)
        .all(options.subscriptionId, ownerId, limit) as any[]
    )
    : (
      db
        .query(`
          SELECT id, subscription_id, owner_id, action, snapshot, created_at
          FROM subscription_versions
          WHERE subscription_id = ?
          ORDER BY id DESC
          LIMIT ?
        `)
        .all(options.subscriptionId, limit) as any[]
    )

  return rows.map((row) => normalizeSubscriptionVersionRow(row))
}

export function rollbackSubscriptionToVersion(input: {
  subscriptionId: number
  versionId: number
}) {
  const db = useDb()
  const currentRow = db
    .query(`
      SELECT id, owner_id, name, keywords, exclude_keywords, match_mode, min_comments, enabled, created_at, updated_at
      FROM subscriptions WHERE id = ?
    `)
    .get(input.subscriptionId) as any

  if (!currentRow) {
    return null
  }

  const current = normalizeSubscriptionRow(currentRow)
  const versionRow = db
    .query(`
      SELECT id, subscription_id, owner_id, action, snapshot, created_at
      FROM subscription_versions
      WHERE id = ? AND subscription_id = ?
    `)
    .get(input.versionId, input.subscriptionId) as any

  if (!versionRow) {
    return null
  }

  const version = normalizeSubscriptionVersionRow(versionRow)
  const snapshot = normalizeSubscriptionSnapshot(version.snapshot, current)

  db
    .query(`
      UPDATE subscriptions
      SET
        owner_id = ?,
        name = ?,
        keywords = ?,
        exclude_keywords = ?,
        match_mode = ?,
        min_comments = ?,
        enabled = ?,
        updated_at = ?
      WHERE id = ?
    `)
    .run(
      snapshot.ownerId,
      snapshot.name,
      JSON.stringify(snapshot.keywords),
      JSON.stringify(snapshot.excludeKeywords),
      snapshot.matchMode,
      snapshot.minComments,
      snapshot.enabled ? 1 : 0,
      nowIso(),
      current.id
    )

  const updatedRow = db
    .query(`
      SELECT id, owner_id, name, keywords, exclude_keywords, match_mode, min_comments, enabled, created_at, updated_at
      FROM subscriptions WHERE id = ?
    `)
    .get(current.id) as any

  const updated = normalizeSubscriptionRow(updatedRow)
  addSubscriptionVersionRecord(db, {
    subscriptionId: updated.id,
    ownerId: updated.ownerId,
    action: 'rollback',
    snapshot: updated
  })

  return updated
}
