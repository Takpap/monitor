export type {
  DeliveryRecord,
  DeliveryStatus,
  HitRecord,
  HitsListOptions,
  HitsPageResult,
  MatchMode,
  MetricsSnapshot,
  MonitorConfig,
  MonitorConfigPatch,
  NotifierConfig,
  NotifyChannel,
  Subscription,
  SubscriptionVersionAction,
  SubscriptionVersionRecord,
  WebhookNotifierConfig,
} from '../internal/db/types'

export { useDb } from '../internal/db/client'
export { getMonitorConfig, setMonitorConfig } from '../internal/db/config'
export { listSubscriptions, createSubscription, updateSubscription, deleteSubscription } from '../internal/db/subscriptions'
export { hasSeen, markSeen, pruneSeenItems, addHit, listHitsPage, listHits } from '../internal/db/hits'
export { listSubscriptionVersions, rollbackSubscriptionToVersion } from '../internal/db/versions'
export { addDeliveryLog } from '../internal/db/deliveries'
export { getMetricsSnapshot } from '../internal/db/metrics'
export {
  isMonitorInitialized,
  setMonitorInitialized,
  getMonitorStatus,
  setMonitorStatus,
} from '../internal/db/monitor-state'
