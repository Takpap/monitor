import {
  type ApiResponse,
  type HitsPageData,
  type MetricsSnapshot,
  type MonitorSettings,
  type MonitorSettingsUpdatePayload,
  type MonitorStatus,
  type NotifierTestPayload,
  type NotifierTestResult,
  type RulePreviewPayload,
  type RulePreviewResult,
  type SubscriptionRecord,
  type SubscriptionUpsertPayload,
  type SubscriptionVersionRecord,
} from '~/types/monitor-console'
import { buildHitsQueryParams, type HitFilterPayload } from '~/composables/monitor-console/utils'
import { buildOwnerQuery } from '~/composables/monitor-console/format'

export async function fetchSettingsApi() {
  const response = await $fetch<ApiResponse<MonitorSettings>>('/api/settings')
  return response.data
}

export async function saveSettingsApi(payload: MonitorSettingsUpdatePayload) {
  const response = await $fetch<ApiResponse<MonitorSettings>>('/api/settings', {
    method: 'PUT',
    body: payload
  })
  return response.data
}

export async function fetchSubscriptionsApi(ownerIdRaw: string) {
  const ownerQuery = buildOwnerQuery(ownerIdRaw)
  const url = ownerQuery ? `/api/subscriptions?${ownerQuery}` : '/api/subscriptions'
  const response = await $fetch<ApiResponse<SubscriptionRecord[]>>(url)
  return response.data
}

export async function createSubscriptionApi(payload: SubscriptionUpsertPayload) {
  const response = await $fetch<ApiResponse<SubscriptionRecord>>('/api/subscriptions', {
    method: 'POST',
    body: payload
  })
  return response.data
}

export async function updateSubscriptionApi(id: number, payload: SubscriptionUpsertPayload) {
  const response = await $fetch<ApiResponse<SubscriptionRecord>>(`/api/subscriptions/${id}`, {
    method: 'PUT',
    body: payload
  })
  return response.data
}

export async function deleteSubscriptionApi(id: number) {
  await $fetch(`/api/subscriptions/${id}`, {
    method: 'DELETE'
  })
}

export async function fetchHitsApi(input: HitFilterPayload) {
  const params = buildHitsQueryParams(input)
  const response = await $fetch<ApiResponse<HitsPageData>>(`/api/hits?${params.toString()}`)
  return response.data
}

export async function fetchStatusApi() {
  const response = await $fetch<ApiResponse<MonitorStatus>>('/api/monitor/status')
  return response.data
}

export async function fetchMetricsApi(ownerIdRaw: string) {
  const ownerQuery = buildOwnerQuery(ownerIdRaw)
  const url = ownerQuery ? `/api/metrics?${ownerQuery}` : '/api/metrics'
  const response = await $fetch<ApiResponse<MetricsSnapshot>>(url)
  return response.data
}

export async function runMonitorNowApi() {
  await $fetch('/api/monitor/run', { method: 'POST' })
}

export async function previewRuleApi(payload: RulePreviewPayload) {
  const response = await $fetch<ApiResponse<RulePreviewResult>>('/api/subscriptions/preview', {
    method: 'POST',
    body: payload
  })
  return response.data
}

export async function testNotifierApi(payload: NotifierTestPayload) {
  const response = await $fetch<ApiResponse<NotifierTestResult>>('/api/notifier/test', {
    method: 'POST',
    body: payload
  })
  return response.data
}

export async function fetchSubscriptionVersionsApi(input: {
  subscriptionId: number
  ownerId: string
  limit?: number
}) {
  const params = new URLSearchParams()
  params.set('subscriptionId', String(input.subscriptionId))
  params.set('limit', String(input.limit ?? 30))

  const ownerId = input.ownerId.trim()
  if (ownerId) {
    params.set('ownerId', ownerId)
  }

  const response = await $fetch<ApiResponse<SubscriptionVersionRecord[]>>(
    `/api/subscriptions/versions?${params.toString()}`
  )
  return response.data
}

export async function rollbackSubscriptionApi(payload: { subscriptionId: number; versionId: number }) {
  const response = await $fetch<ApiResponse<SubscriptionRecord>>('/api/subscriptions/rollback', {
    method: 'POST',
    body: payload
  })
  return response.data
}
