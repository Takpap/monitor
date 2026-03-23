import {
  addHit,
  getMonitorConfig,
  getMonitorStatus,
  hasSeen,
  isMonitorInitialized,
  listSubscriptions,
  markSeen,
  pruneSeenItems,
  setMonitorInitialized,
  setMonitorStatus,
} from './db'
import { fetchCommentCount, fetchFeedItems } from './rss'
import { enqueueNotification, getNotificationQueueState } from './notification-queue'
import { evaluateFeedItemAgainstSubscription } from './rule-evaluator'

let running = false

function nowIso() {
  return new Date().toISOString()
}

function setLastError(errorMessage: string | null) {
  setMonitorStatus({ lastError: errorMessage ?? '' })
}

export function getMonitorRuntimeState() {
  return {
    running,
    queue: getNotificationQueueState(),
    ...getMonitorStatus()
  }
}

export async function runMonitorCycle(trigger: 'auto' | 'manual' = 'auto') {
  if (running) {
    return {
      ok: true,
      skipped: true,
      reason: 'monitor_already_running'
    }
  }

  running = true
  const startedAt = nowIso()

  try {
    const config = getMonitorConfig()
    const subscriptions = listSubscriptions().filter((s) => s.enabled)

    if (subscriptions.length === 0) {
      const summary = {
        trigger,
        startedAt,
        scannedItems: 0,
        matchedRules: 0,
        notified: 0,
        bootstrapIndexed: 0,
        note: 'no_enabled_subscriptions'
      }
      setMonitorStatus({
        lastRunAt: startedAt,
        lastSummary: JSON.stringify(summary),
        lastError: ''
      })
      return { ok: true, skipped: false, summary }
    }

    const items = await fetchFeedItems({
      feedUrls: config.feedUrls,
      timeoutMs: config.httpTimeoutMs,
      userAgent: config.httpUserAgent
    })

    const firstRunBootstrap = !isMonitorInitialized() && config.bootstrapSkipExisting
    let matchedRules = 0
    let notified = 0
    let bootstrapIndexed = 0

    if (firstRunBootstrap) {
      const seenAt = nowIso()
      for (const item of items) {
        for (const sub of subscriptions) {
          const match = evaluateFeedItemAgainstSubscription(item, sub)
          if (!match.matched) continue
          markSeen(sub.id, item.uniqueId, seenAt)
          bootstrapIndexed += 1
        }
      }

      setMonitorInitialized(true)
      pruneSeenItems(config.maxSeenDays)

      const summary = {
        trigger,
        startedAt,
        scannedItems: items.length,
        matchedRules,
        notified,
        bootstrapIndexed,
        note: 'bootstrap_skip_existing'
      }

      setMonitorStatus({
        lastRunAt: startedAt,
        lastSummary: JSON.stringify(summary),
        lastError: ''
      })

      return { ok: true, skipped: false, summary }
    }

    if (!isMonitorInitialized()) {
      setMonitorInitialized(true)
    }

    const commentCache = new Map<string, number | null>()
    const seenAt = nowIso()

    for (const item of items) {
      for (const sub of subscriptions) {
        if (hasSeen(sub.id, item.uniqueId)) {
          continue
        }

        const match = evaluateFeedItemAgainstSubscription(item, sub)
        if (!match.matched) {
          continue
        }

        matchedRules += 1

        const minComments = sub.minComments || 0
        let commentCount: number | null = null

        if (minComments > 0) {
          if (commentCache.has(item.uniqueId)) {
            commentCount = commentCache.get(item.uniqueId) ?? null
          } else {
            commentCount = await fetchCommentCount(item, {
              timeoutMs: config.httpTimeoutMs,
              userAgent: config.httpUserAgent
            })
            commentCache.set(item.uniqueId, commentCount)
          }

          if (commentCount === null && config.strictCommentFilter) {
            continue
          }

          if (commentCount !== null && commentCount < minComments) {
            continue
          }
        }

        markSeen(sub.id, item.uniqueId, seenAt)

        const hitId = addHit({
          ownerId: sub.ownerId,
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          itemId: item.uniqueId,
          articleId: item.articleId,
          title: item.title,
          link: item.link,
          commentCount,
          minComments,
          matchedKeywords: match.matchedKeywords,
          imageUrl: item.imageUrl,
          pubDate: item.pubDate,
          createdAt: nowIso()
        })

        enqueueNotification(
          {
            hitId,
            ownerId: sub.ownerId,
            subscriptionId: sub.id,
            subscriptionName: sub.name,
            title: item.title,
            link: item.link,
            commentCount,
            minComments,
            matchedKeywords: match.matchedKeywords,
            imageUrl: item.imageUrl,
            pubDate: item.pubDate,
            createdAt: nowIso()
          },
          config
        )

        notified += 1
      }
    }

    pruneSeenItems(config.maxSeenDays)

    const summary = {
      trigger,
      startedAt,
      scannedItems: items.length,
      matchedRules,
      notified,
      bootstrapIndexed
    }

    setMonitorStatus({
      lastRunAt: startedAt,
      lastSummary: JSON.stringify(summary),
      lastError: ''
    })

    return { ok: true, skipped: false, summary }
  } catch (error: any) {
    const msg = error?.message || String(error)
    setLastError(msg)
    setMonitorStatus({ lastRunAt: startedAt })
    return {
      ok: false,
      skipped: false,
      error: msg
    }
  } finally {
    running = false
  }
}
