import { useDb } from './client'
import { nowIso } from './helpers'
import { normalizeSubscriptionRow } from './normalize'
import { addSubscriptionVersionRecord } from './version-log'
import type { MatchMode } from './types'

export function listSubscriptions(options?: { ownerId?: string }) {
  const db = useDb()
  const ownerId = options?.ownerId?.trim()

  const rows = ownerId
    ? (
      db
        .query(`
          SELECT
            id,
            owner_id,
            name,
            keywords,
            exclude_keywords,
            match_mode,
            min_comments,
            enabled,
            created_at,
            updated_at
          FROM subscriptions
          WHERE owner_id = ?
          ORDER BY id DESC
        `)
        .all(ownerId) as any[]
    )
    : (
      db
        .query(`
          SELECT
            id,
            owner_id,
            name,
            keywords,
            exclude_keywords,
            match_mode,
            min_comments,
            enabled,
            created_at,
            updated_at
          FROM subscriptions
          ORDER BY id DESC
        `)
        .all() as any[]
    )

  return rows.map((row) => normalizeSubscriptionRow(row))
}

export function createSubscription(input: {
  ownerId?: string
  name: string
  keywords: string[]
  excludeKeywords: string[]
  matchMode: MatchMode
  minComments: number
  enabled: boolean
}) {
  const db = useDb()
  const ts = nowIso()
  const ownerId = input.ownerId?.trim() || 'default'

  db
    .query(`
      INSERT INTO subscriptions (
        owner_id,
        name,
        keywords,
        exclude_keywords,
        match_mode,
        min_comments,
        enabled,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      ownerId,
      input.name,
      JSON.stringify(input.keywords),
      JSON.stringify(input.excludeKeywords),
      input.matchMode,
      input.minComments,
      input.enabled ? 1 : 0,
      ts,
      ts
    )

  const row = db
    .query(`
      SELECT id, owner_id, name, keywords, exclude_keywords, match_mode, min_comments, enabled, created_at, updated_at
      FROM subscriptions
      WHERE id = last_insert_rowid()
    `)
    .get() as any

  const record = normalizeSubscriptionRow(row)
  addSubscriptionVersionRecord(db, {
    subscriptionId: record.id,
    ownerId: record.ownerId,
    action: 'create',
    snapshot: record
  })

  return record
}

export function updateSubscription(
  id: number,
  input: Partial<{
    ownerId: string
    name: string
    keywords: string[]
    excludeKeywords: string[]
    matchMode: MatchMode
    minComments: number
    enabled: boolean
  }>
) {
  const db = useDb()
  const existing = db
    .query(`
      SELECT id, owner_id, name, keywords, exclude_keywords, match_mode, min_comments, enabled, created_at, updated_at
      FROM subscriptions WHERE id = ?
    `)
    .get(id) as any

  if (!existing) {
    return null
  }

  const patch = normalizeSubscriptionRow(existing)
  const merged = {
    ...patch,
    ...input,
    ownerId: input.ownerId?.trim() || patch.ownerId
  }

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
      merged.ownerId,
      merged.name,
      JSON.stringify(merged.keywords),
      JSON.stringify(merged.excludeKeywords),
      merged.matchMode,
      merged.minComments,
      merged.enabled ? 1 : 0,
      nowIso(),
      id
    )

  const row = db
    .query(`
      SELECT id, owner_id, name, keywords, exclude_keywords, match_mode, min_comments, enabled, created_at, updated_at
      FROM subscriptions
      WHERE id = ?
    `)
    .get(id) as any

  const record = normalizeSubscriptionRow(row)
  addSubscriptionVersionRecord(db, {
    subscriptionId: record.id,
    ownerId: record.ownerId,
    action: 'update',
    snapshot: record
  })

  return record
}

export function deleteSubscription(id: number) {
  const db = useDb()
  const existing = db
    .query(`
      SELECT id, owner_id, name, keywords, exclude_keywords, match_mode, min_comments, enabled, created_at, updated_at
      FROM subscriptions WHERE id = ?
    `)
    .get(id) as any

  if (existing) {
    const snapshot = normalizeSubscriptionRow(existing)
    addSubscriptionVersionRecord(db, {
      subscriptionId: snapshot.id,
      ownerId: snapshot.ownerId,
      action: 'delete',
      snapshot
    })
  }

  db.query('DELETE FROM subscriptions WHERE id = ?').run(id)
  db.query('DELETE FROM seen_items WHERE subscription_id = ?').run(id)
}
