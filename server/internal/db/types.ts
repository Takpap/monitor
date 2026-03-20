export type MatchMode = 'any' | 'all'
export type NotifyChannel = 'console' | 'webhook'
export type DeliveryStatus = 'sent' | 'failed' | 'skipped'
export type SubscriptionVersionAction = 'create' | 'update' | 'rollback' | 'delete'

export interface WebhookNotifierConfig {
  enabled: boolean
  url: string
  headers: Record<string, string>
  timeoutMs: number
}

export interface NotifierConfig {
  channels: NotifyChannel[]
  webhook: WebhookNotifierConfig
}

export interface MonitorConfig {
  pollIntervalSeconds: number
  bootstrapSkipExisting: boolean
  strictCommentFilter: boolean
  maxSeenDays: number
  feedUrls: string[]
  httpTimeoutMs: number
  httpUserAgent: string
  notifier: NotifierConfig
}

export interface MonitorConfigPatch extends Partial<Omit<MonitorConfig, 'notifier'>> {
  notifier?: Partial<Omit<NotifierConfig, 'webhook'>> & {
    webhook?: Partial<WebhookNotifierConfig>
  }
}

export interface Subscription {
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

export interface SubscriptionVersionRecord {
  id: number
  subscriptionId: number
  ownerId: string
  action: SubscriptionVersionAction
  snapshot: Subscription
  createdAt: string
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

export interface DeliveryRecord {
  id: number
  hitId: number
  ownerId: string
  channel: NotifyChannel
  status: DeliveryStatus
  errorMessage: string | null
  createdAt: string
}

export interface MetricsSnapshot {
  ownerId: string | null
  subscriptionsTotal: number
  subscriptionsEnabled: number
  hitsTotal: number
  hits24h: number
  deliveryFailed24h: number
  generatedAt: string
}

export interface HitsListOptions {
  limit?: number
  ownerId?: string
  cursorId?: number
  subscriptionId?: number
  keyword?: string
  commentMin?: number
  commentMax?: number
}

export interface HitsPageResult {
  items: HitRecord[]
  nextCursor: number | null
  hasMore: boolean
  limit: number
}
