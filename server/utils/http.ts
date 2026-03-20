import { getRouterParam, type H3Event } from 'h3'

export function parsePositiveRouteParam(event: H3Event, paramName = 'id', label = 'ID') {
  const raw = getRouterParam(event, paramName)
  const parsed = Number.parseInt(raw || '', 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `${label} 不合法`
    })
  }
  return parsed
}
