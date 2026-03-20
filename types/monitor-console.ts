export type MatchMode = 'any' | 'all'
export type NotifyChannel = 'console' | 'webhook'
export type PageSection = 'overview' | 'rules' | 'events'

export interface MonitorSettings {
  pollIntervalSeconds: number
  bootstrapSkipExisting: boolean
  strictCommentFilter: boolean
  maxSeenDays: number
  feedUrls: string[]
  httpTimeoutMs: number
  httpUserAgent: string
  notifier: {
    channels: NotifyChannel[]
    webhook: {
      enabled: boolean
      url: string
      headers: Record<string, string>
      timeoutMs: number
    }
  }
}

export interface MonitorSettingsUpdatePayload {
  pollIntervalSeconds?: number
  bootstrapSkipExisting?: boolean
  strictCommentFilter?: boolean
  maxSeenDays?: number
  feedUrls?: string[]
  httpTimeoutMs?: number
  httpUserAgent?: string
  notifier?: {
    channels?: NotifyChannel[]
    webhook?: {
      enabled?: boolean
      url?: string
      headers?: Record<string, string>
      timeoutMs?: number
    }
  }
}

export interface SubscriptionRecord {
  id: number
  ownerId: string
  name: string
  keywords: string[]
  excludeKeywords: string[]
  matchMode: MatchMode
  minComments: number
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface SubscriptionUpsertPayload {
  ownerId: string
  name: string
  keywords: string[]
  excludeKeywords: string[]
  matchMode: MatchMode
  minComments: number
  enabled: boolean
}

export interface HitRecord {
  id: number
  ownerId: string
  subscriptionId: number
  subscriptionName: string
  itemId: string
  articleId: string | null
  title: string
  link: string
  commentCount: number | null
  minComments: number
  matchedKeywords: string[]
  pubDate: string
  createdAt: string
}

export type SubscriptionVersionAction = 'create' | 'update' | 'rollback' | 'delete'

export interface SubscriptionVersionRecord {
  id: number
  subscriptionId: number
  ownerId: string
  action: SubscriptionVersionAction
  snapshot: SubscriptionRecord
  createdAt: string
}

export interface MonitorStatus {
  running: boolean
  queue?: {
    pending: number
    running: number
  }
  lastRunAt: string | null
  lastSummary: string | null
  lastError: string | null
  runPhase?: string | null
  lastSummaryParsed: Record<string, any> | null
}

export interface MetricsSnapshot {
  ownerId: string | null
  subscriptionsTotal: number
  subscriptionsEnabled: number
  hitsTotal: number
  hits24h: number
  deliveryFailed24h: number
  generatedAt: string
  queuePending: number
  queueRunning: number
}

export interface HitsPageData {
  items: HitRecord[]
  nextCursor: number | null
  hasMore: boolean
  limit: number
}

export interface RulePreviewResult {
  matched: boolean
  excluded: boolean
  matchedKeywords: string[]
  excludedKeywords: string[]
  text: string
}

export interface RulePreviewPayload {
  title: string
  description: string
  keywords: string[]
  excludeKeywords: string[]
  matchMode: MatchMode
}

export interface NotifierTestResult {
  sent: number
  failed: number
  skipped: number
  results: Array<{
    channel: NotifyChannel
    status: 'sent' | 'failed' | 'skipped'
    errorMessage?: string
  }>
}

export interface NotifierTestPayload {
  ownerId?: string
  title?: string
  link?: string
  matchedKeywords?: string[]
  channels?: NotifyChannel[]
}

export interface ApiResponse<T> {
  ok: boolean
  data: T
}
