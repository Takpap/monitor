export function toInt(value: string | number, fallback = 0) {
  const parsed = Number.parseInt(String(value), 10)
  return Number.isInteger(parsed) ? parsed : fallback
}

export function parsePositiveInt(value: string | number) {
  const parsed = Number.parseInt(String(value), 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

export function parseLines(value: string) {
  return Array.from(new Set(value.split(/[\n,，]/g).map((item) => item.trim()).filter(Boolean)))
}

export function normalizeKeywords(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)))
}

export interface HitFilterPayload {
  ownerId: string
  limit: string | number
  subscriptionId: string | number
  keyword: string
  commentMin: string | number
  commentMax: string | number
  reset: boolean
  cursorId: number | null
}

export function buildHitsQueryParams(input: HitFilterPayload) {
  const params = new URLSearchParams()

  params.set('limit', String(Math.min(Math.max(toInt(input.limit, 50), 1), 200)))

  if (input.ownerId) {
    params.set('ownerId', input.ownerId)
  }

  const subscriptionId = parsePositiveInt(input.subscriptionId)
  if (subscriptionId) {
    params.set('subscriptionId', String(subscriptionId))
  }

  const keyword = String(input.keyword || '').trim()
  if (keyword) {
    params.set('keyword', keyword)
  }

  const commentMin = parsePositiveInt(input.commentMin)
  if (commentMin !== undefined) {
    params.set('commentMin', String(commentMin))
  } else if (String(input.commentMin).trim() === '0') {
    params.set('commentMin', '0')
  }

  const commentMax = parsePositiveInt(input.commentMax)
  if (commentMax !== undefined) {
    params.set('commentMax', String(commentMax))
  } else if (String(input.commentMax).trim() === '0') {
    params.set('commentMax', '0')
  }

  if (!input.reset && input.cursorId) {
    params.set('cursorId', String(input.cursorId))
  }

  return params
}
