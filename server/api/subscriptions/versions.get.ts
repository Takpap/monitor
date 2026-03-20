import { getQuery } from 'h3'
import { listSubscriptionVersions } from '~/server/utils/db'
import { subscriptionVersionsQuerySchema } from '~/server/utils/validators'

export default defineEventHandler((event) => {
  const parsed = subscriptionVersionsQuerySchema.safeParse(getQuery(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: '版本查询参数不合法',
      data: parsed.error.flatten()
    })
  }

  const { subscriptionId, ownerId, limit } = parsed.data
  return {
    ok: true,
    data: listSubscriptionVersions({
      subscriptionId,
      ownerId,
      limit
    })
  }
})
