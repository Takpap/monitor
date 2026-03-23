import { useDb } from './client'
import { escapeLike } from './helpers'
import { normalizeHitRow } from './normalize'
import type { HitRecord, HitsListOptions, HitsPageResult } from './types'

export function hasSeen(subscriptionId: number, itemId: string) {
  const db = useDb()
  const row = db
    .query('SELECT 1 AS ok FROM seen_items WHERE subscription_id = ? AND item_id = ?')
    .get(subscriptionId, itemId) as { ok: number } | null

  return Boolean(row?.ok)
}

export function markSeen(subscriptionId: number, itemId: string, seenAt: string) {
  const db = useDb()
  db
    .query(`
      INSERT INTO seen_items (subscription_id, item_id, seen_at)
      VALUES (?, ?, ?)
      ON CONFLICT(subscription_id, item_id)
      DO UPDATE SET seen_at = excluded.seen_at
    `)
    .run(subscriptionId, itemId, seenAt)
}

export function pruneSeenItems(maxSeenDays: number) {
  const db = useDb()
  const threshold = new Date(Date.now() - maxSeenDays * 24 * 60 * 60 * 1000).toISOString()
  db.query('DELETE FROM seen_items WHERE seen_at < ?').run(threshold)
}

export function addHit(input: Omit<HitRecord, 'id'>) {
  const db = useDb()
  const result = db
    .query(`
      INSERT INTO hits (
        owner_id,
        subscription_id,
        subscription_name,
        item_id,
        article_id,
        title,
        link,
        comment_count,
        min_comments,
        matched_keywords,
        image_url,
        pub_date,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      input.ownerId,
      input.subscriptionId,
      input.subscriptionName,
      input.itemId,
      input.articleId,
      input.title,
      input.link,
      input.commentCount,
      input.minComments,
      JSON.stringify(input.matchedKeywords),
      input.imageUrl,
      input.pubDate,
      input.createdAt
    )

  return Number(result.lastInsertRowid)
}

export function listHitsPage(options: HitsListOptions = {}): HitsPageResult {
  const db = useDb()
  const limit = Math.min(Math.max(options.limit || 50, 1), 200)
  const ownerId = options.ownerId?.trim()
  const keyword = options.keyword?.trim()

  const conditions: string[] = []
  const params: Array<string | number> = []

  if (ownerId) {
    conditions.push('owner_id = ?')
    params.push(ownerId)
  }

  if (options.cursorId && Number.isInteger(options.cursorId) && options.cursorId > 0) {
    conditions.push('id < ?')
    params.push(options.cursorId)
  }

  if (options.subscriptionId && Number.isInteger(options.subscriptionId) && options.subscriptionId > 0) {
    conditions.push('subscription_id = ?')
    params.push(options.subscriptionId)
  }

  if (keyword) {
    const like = `%${escapeLike(keyword)}%`
    conditions.push(`(title LIKE ? ESCAPE '\\' OR matched_keywords LIKE ? ESCAPE '\\')`)
    params.push(like, like)
  }

  if (options.commentMin !== undefined && Number.isFinite(options.commentMin)) {
    conditions.push('comment_count IS NOT NULL AND comment_count >= ?')
    params.push(Math.max(0, Math.trunc(options.commentMin)))
  }

  if (options.commentMax !== undefined && Number.isFinite(options.commentMax)) {
    conditions.push('comment_count IS NOT NULL AND comment_count <= ?')
    params.push(Math.max(0, Math.trunc(options.commentMax)))
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db
    .query(`
      SELECT
        id,
        owner_id,
        subscription_id,
        subscription_name,
        item_id,
        article_id,
        title,
        link,
        comment_count,
        min_comments,
        matched_keywords,
        image_url,
        pub_date,
        created_at
      FROM hits
      ${whereClause}
      ORDER BY id DESC
      LIMIT ?
    `)
    .all(...params, limit + 1) as any[]

  const hasMore = rows.length > limit
  const items = (hasMore ? rows.slice(0, limit) : rows).map((row) => normalizeHitRow(row))
  const nextCursor = hasMore ? items[items.length - 1]?.id || null : null

  return {
    items,
    nextCursor,
    hasMore,
    limit
  }
}

export function listHits(options: HitsListOptions = {}) {
  return listHitsPage(options).items
}
