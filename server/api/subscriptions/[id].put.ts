import { updateSubscription } from '~/server/utils/db'
import { parsePositiveRouteParam } from '~/server/utils/http'
import { subscriptionUpdateSchema } from '~/server/utils/validators'

export default defineEventHandler(async (event) => {
  const id = parsePositiveRouteParam(event, 'id', '订阅 ID')
  const body = await readBody(event)
  const parsed = subscriptionUpdateSchema.safeParse(body ?? {})

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: '订阅参数不合法',
      data: parsed.error.flatten()
    })
  }

  if (Object.keys(parsed.data).length === 0) {
    throw createError({ statusCode: 400, statusMessage: '至少提供一个更新字段' })
  }

  const record = updateSubscription(id, parsed.data)
  if (!record) {
    throw createError({ statusCode: 404, statusMessage: '订阅不存在' })
  }

  return {
    ok: true,
    data: record
  }
})
