import { getQuery, setHeader } from 'h3'
import { getMetricsSnapshot } from '~/server/utils/db'
import { getNotificationQueueState } from '~/server/utils/notification-queue'

function toPrometheus(metrics: ReturnType<typeof getMetricsSnapshot>, queue: { pending: number; running: number }) {
  const ownerLabel = metrics.ownerId ? `owner_id="${metrics.ownerId.replace(/"/g, '\\"')}"` : 'owner_id="all"'

  return [
    '# HELP smzdm_subscriptions_total Total subscriptions',
    '# TYPE smzdm_subscriptions_total gauge',
    `smzdm_subscriptions_total{${ownerLabel}} ${metrics.subscriptionsTotal}`,
    '# HELP smzdm_subscriptions_enabled Enabled subscriptions',
    '# TYPE smzdm_subscriptions_enabled gauge',
    `smzdm_subscriptions_enabled{${ownerLabel}} ${metrics.subscriptionsEnabled}`,
    '# HELP smzdm_hits_total Total hits',
    '# TYPE smzdm_hits_total counter',
    `smzdm_hits_total{${ownerLabel}} ${metrics.hitsTotal}`,
    '# HELP smzdm_hits_24h Hits in last 24h',
    '# TYPE smzdm_hits_24h gauge',
    `smzdm_hits_24h{${ownerLabel}} ${metrics.hits24h}`,
    '# HELP smzdm_delivery_failed_24h Delivery failures in last 24h',
    '# TYPE smzdm_delivery_failed_24h gauge',
    `smzdm_delivery_failed_24h{${ownerLabel}} ${metrics.deliveryFailed24h}`,
    '# HELP smzdm_notify_queue_pending Pending notify jobs',
    '# TYPE smzdm_notify_queue_pending gauge',
    `smzdm_notify_queue_pending ${queue.pending}`,
    '# HELP smzdm_notify_queue_running Running notify workers',
    '# TYPE smzdm_notify_queue_running gauge',
    `smzdm_notify_queue_running ${queue.running}`
  ].join('\n')
}

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const ownerId = String(query.ownerId || '').trim() || undefined
  const format = String(query.format || '').trim().toLowerCase()

  const metrics = getMetricsSnapshot({ ownerId })
  const queue = getNotificationQueueState()

  if (format === 'prometheus' || format === 'prom') {
    setHeader(event, 'Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
    return toPrometheus(metrics, queue)
  }

  return {
    ok: true,
    data: {
      ...metrics,
      queuePending: queue.pending,
      queueRunning: queue.running
    }
  }
})
