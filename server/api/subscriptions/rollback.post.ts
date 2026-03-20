import { rollbackSubscriptionToVersion } from '~/server/utils/db'
import { subscriptionRollbackSchema } from '~/server/utils/validators'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = subscriptionRollbackSchema.safeParse(body ?? {})

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: '回滚参数不合法',
      data: parsed.error.flatten()
    })
  }

  const record = rollbackSubscriptionToVersion(parsed.data)
  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: '订阅或版本不存在'
    })
  }

  return {
    ok: true,
    data: record
  }
})
