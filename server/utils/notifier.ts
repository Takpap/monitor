import { addDeliveryLog, type MonitorConfig, type NotifyChannel } from './db'

interface NotificationPayloadBase {
  ownerId: string
  subscriptionName: string
  title: string
  link: string
  commentCount: number | null
  minComments: number
  matchedKeywords: string[]
  imageUrl: string | null
  pubDate: string
  createdAt: string
}

export interface HitNotificationPayload extends NotificationPayloadBase {
  hitId: number
  subscriptionId: number
}

export interface NotifyResult {
  channel: NotifyChannel
  status: 'sent' | 'failed' | 'skipped'
  errorMessage?: string
}

export interface NotifySummary {
  sent: number
  failed: number
  skipped: number
  results: NotifyResult[]
}

export interface TestNotifyInput {
  ownerId?: string
  title?: string
  link?: string
  matchedKeywords?: string[]
  channels?: NotifyChannel[]
}

function nowIso() {
  return new Date().toISOString()
}

function normalizeChannels(input: NotifyChannel[] | undefined, fallback: NotifyChannel[]) {
  const source = input && input.length > 0 ? input : fallback
  const normalized = Array.from(
    new Set(
      source.filter((item): item is NotifyChannel => item === 'console' || item === 'webhook')
    )
  )

  return normalized.length > 0 ? normalized : ['console']
}

function summarize(results: NotifyResult[]): NotifySummary {
  return {
    sent: results.filter((item) => item.status === 'sent').length,
    failed: results.filter((item) => item.status === 'failed').length,
    skipped: results.filter((item) => item.status === 'skipped').length,
    results
  }
}

async function sendConsole(payload: NotificationPayloadBase): Promise<NotifyResult> {
  const preview = {
    ownerId: payload.ownerId,
    subscriptionName: payload.subscriptionName,
    title: payload.title,
    link: payload.link,
    commentCount: payload.commentCount,
    minComments: payload.minComments,
    matchedKeywords: payload.matchedKeywords
  }

  console.log('[notify:console]', JSON.stringify(preview))
  return { channel: 'console', status: 'sent' }
}

async function sendWebhook(payload: NotificationPayloadBase, config: MonitorConfig): Promise<NotifyResult> {
  const webhook = config.notifier.webhook

  if (!webhook.enabled) {
    return { channel: 'webhook', status: 'skipped', errorMessage: 'webhook_disabled' }
  }

  if (!webhook.url) {
    return { channel: 'webhook', status: 'skipped', errorMessage: 'webhook_url_empty' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), webhook.timeoutMs)

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...webhook.headers
      },
      body: JSON.stringify({
        event: 'smzdm_hit',
        payload
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      return {
        channel: 'webhook',
        status: 'failed',
        errorMessage: `HTTP_${response.status}`
      }
    }

    return { channel: 'webhook', status: 'sent' }
  } catch (error: any) {
    return {
      channel: 'webhook',
      status: 'failed',
      errorMessage: error?.message || String(error)
    }
  } finally {
    clearTimeout(timer)
  }
}

async function sendByChannel(
  channel: NotifyChannel,
  payload: NotificationPayloadBase,
  config: MonitorConfig
): Promise<NotifyResult> {
  if (channel === 'console') {
    return sendConsole(payload)
  }

  return sendWebhook(payload, config)
}

export async function notifyHit(payload: HitNotificationPayload, config: MonitorConfig) {
  const channels = normalizeChannels(undefined, config.notifier.channels)
  const results: NotifyResult[] = []

  for (const channel of channels) {
    const result = await sendByChannel(channel, payload, config)
    results.push(result)

    addDeliveryLog({
      hitId: payload.hitId,
      ownerId: payload.ownerId,
      channel,
      status: result.status,
      errorMessage: result.errorMessage || null,
      createdAt: nowIso()
    })
  }

  return summarize(results)
}

export async function notifyTest(config: MonitorConfig, input: TestNotifyInput = {}) {
  const payload: NotificationPayloadBase = {
    ownerId: input.ownerId?.trim() || 'default',
    subscriptionName: 'system-test',
    title: input.title?.trim() || 'SMZDM Monitor 通知测试',
    link: input.link?.trim() || 'https://www.smzdm.com/',
    commentCount: null,
    minComments: 0,
    matchedKeywords: Array.isArray(input.matchedKeywords)
      ? input.matchedKeywords.map((item) => item.trim()).filter(Boolean)
      : ['test'],
    imageUrl: null,
    pubDate: nowIso(),
    createdAt: nowIso()
  }

  const channels = normalizeChannels(input.channels, config.notifier.channels)
  const results: NotifyResult[] = []

  for (const channel of channels) {
    const result = await sendByChannel(channel, payload, config)
    results.push(result)
  }

  return {
    ...summarize(results),
    payloadPreview: payload
  }
}
