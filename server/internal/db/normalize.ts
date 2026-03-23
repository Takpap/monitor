import type {
  HitRecord,
  MonitorConfig,
  NotifyChannel,
  Subscription,
  SubscriptionVersionRecord,
} from './types'

export const DEFAULT_MONITOR_CONFIG: MonitorConfig = {
  pollIntervalSeconds: 120,
  bootstrapSkipExisting: true,
  strictCommentFilter: true,
  maxSeenDays: 7,
  feedUrls: ['http://feed.smzdm.com'],
  httpTimeoutMs: 12000,
  httpUserAgent: 'Mozilla/5.0 (compatible; smzdm-monitor/2.0; +https://www.smzdm.com/)',
  notifier: {
    channels: ['console'],
    webhook: {
      enabled: false,
      url: '',
      headers: {},
      timeoutMs: 8000
    }
  }
}

export function jsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function normalizeChannels(input: unknown): NotifyChannel[] {
  const raw = Array.isArray(input) ? input : []
  const channels = Array.from(
    new Set(
      raw.filter((item): item is NotifyChannel => item === 'console' || item === 'webhook')
    )
  )

  return channels.length > 0 ? channels : ['console']
}

function normalizeHeaders(input: unknown): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {}
  }

  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(input)) {
    const normalizedKey = key.trim()
    if (!normalizedKey) continue
    result[normalizedKey] = String(value ?? '').trim()
  }
  return result
}

export function normalizeMonitorConfig(raw: Partial<MonitorConfig>): MonitorConfig {
  const merged = {
    ...DEFAULT_MONITOR_CONFIG,
    ...raw,
    notifier: {
      ...DEFAULT_MONITOR_CONFIG.notifier,
      ...(raw.notifier || {}),
      webhook: {
        ...DEFAULT_MONITOR_CONFIG.notifier.webhook,
        ...(raw.notifier?.webhook || {})
      }
    }
  }

  return {
    pollIntervalSeconds: Math.max(10, Number(merged.pollIntervalSeconds) || 120),
    bootstrapSkipExisting: Boolean(merged.bootstrapSkipExisting),
    strictCommentFilter: Boolean(merged.strictCommentFilter),
    maxSeenDays: Math.max(1, Number(merged.maxSeenDays) || 7),
    feedUrls: Array.isArray(merged.feedUrls) ? merged.feedUrls.filter(Boolean) : DEFAULT_MONITOR_CONFIG.feedUrls,
    httpTimeoutMs: Math.max(3000, Number(merged.httpTimeoutMs) || 12000),
    httpUserAgent: String(merged.httpUserAgent || DEFAULT_MONITOR_CONFIG.httpUserAgent),
    notifier: {
      channels: normalizeChannels(merged.notifier.channels),
      webhook: {
        enabled: Boolean(merged.notifier.webhook.enabled),
        url: String(merged.notifier.webhook.url || ''),
        headers: normalizeHeaders(merged.notifier.webhook.headers),
        timeoutMs: Math.max(1000, Number(merged.notifier.webhook.timeoutMs) || 8000)
      }
    }
  }
}

function normalizeKeywordList(input: unknown, fallback: string[]) {
  if (!Array.isArray(input)) {
    return fallback
  }

  const normalized = Array.from(
    new Set(
      input
        .map((item) => String(item ?? '').trim())
        .filter(Boolean)
    )
  )

  return normalized.length > 0 ? normalized : fallback
}

export function normalizeSubscriptionSnapshot(input: unknown, fallback: Subscription): Subscription {
  const snapshot = input && typeof input === 'object' ? (input as any) : {}
  const minCommentsRaw = Number(snapshot.minComments)

  return {
    id: Number.isInteger(snapshot.id) ? snapshot.id : fallback.id,
    ownerId: String(snapshot.ownerId || fallback.ownerId).trim() || fallback.ownerId,
    name: String(snapshot.name || fallback.name).trim() || fallback.name,
    keywords: normalizeKeywordList(snapshot.keywords, fallback.keywords),
    excludeKeywords: Array.isArray(snapshot.excludeKeywords)
      ? snapshot.excludeKeywords.map((item: unknown) => String(item ?? '').trim()).filter(Boolean)
      : fallback.excludeKeywords,
    matchMode: snapshot.matchMode === 'all' ? 'all' : (snapshot.matchMode === 'any' ? 'any' : fallback.matchMode),
    minComments: Number.isFinite(minCommentsRaw) ? Math.max(0, Math.trunc(minCommentsRaw)) : fallback.minComments,
    enabled: typeof snapshot.enabled === 'boolean' ? snapshot.enabled : fallback.enabled,
    createdAt: typeof snapshot.createdAt === 'string' ? snapshot.createdAt : fallback.createdAt,
    updatedAt: typeof snapshot.updatedAt === 'string' ? snapshot.updatedAt : fallback.updatedAt
  }
}

export function normalizeSubscriptionRow(row: any): Subscription {
  return {
    id: row.id,
    ownerId: row.owner_id || 'default',
    name: row.name,
    keywords: jsonParse<string[]>(row.keywords, []),
    excludeKeywords: jsonParse<string[]>(row.exclude_keywords, []),
    matchMode: row.match_mode,
    minComments: row.min_comments,
    enabled: Boolean(row.enabled),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function normalizeHitRow(row: any): HitRecord {
  return {
    id: row.id,
    ownerId: row.owner_id || 'default',
    subscriptionId: row.subscription_id,
    subscriptionName: row.subscription_name,
    itemId: row.item_id,
    articleId: row.article_id,
    title: row.title,
    link: row.link,
    commentCount: row.comment_count,
    minComments: row.min_comments,
    matchedKeywords: jsonParse<string[]>(row.matched_keywords, []),
    imageUrl: row.image_url,
    pubDate: row.pub_date,
    createdAt: row.created_at
  }
}

export function normalizeSubscriptionVersionRow(row: any): SubscriptionVersionRecord {
  const fallbackSnapshot: Subscription = {
    id: row.subscription_id,
    ownerId: row.owner_id || 'default',
    name: '未知订阅',
    keywords: [],
    excludeKeywords: [],
    matchMode: 'any',
    minComments: 0,
    enabled: true,
    createdAt: row.created_at,
    updatedAt: row.created_at
  }

  const parsed = jsonParse<any>(row.snapshot, null)

  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    ownerId: row.owner_id || 'default',
    action: row.action,
    snapshot: normalizeSubscriptionSnapshot(parsed, fallbackSnapshot),
    createdAt: row.created_at
  }
}
