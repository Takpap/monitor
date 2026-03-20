import type { SubscriptionVersionAction } from '~/types/monitor-console'

export function versionActionLabel(action: SubscriptionVersionAction) {
  if (action === 'create') return '创建'
  if (action === 'update') return '更新'
  if (action === 'rollback') return '回滚'
  return '删除'
}

export function stringifyHeaders(headers: Record<string, string>) {
  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')
}

export function parseHeaders(value: string) {
  const headers: Record<string, string> = {}

  for (const rawLine of value.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    const idx = line.indexOf(':')
    if (idx <= 0) continue

    const key = line.slice(0, idx).trim()
    const val = line.slice(idx + 1).trim()
    if (!key) continue

    headers[key] = val
  }

  return headers
}

export function parseRequestError(error: any) {
  return (
    error?.data?.statusMessage ||
    error?.statusMessage ||
    error?.message ||
    '请求失败，请稍后重试'
  )
}

export function formatDateTime(value: string | null) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

export function buildOwnerQuery(ownerIdRaw: string) {
  const ownerId = ownerIdRaw.trim()
  return ownerId ? `ownerId=${encodeURIComponent(ownerId)}` : ''
}
