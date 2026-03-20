import { getQuery } from 'h3'
import { listHitsPage } from '~/server/utils/db'
import { hitsQuerySchema } from '~/server/utils/validators'

export default defineEventHandler((event) => {
  const parsed = hitsQuerySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: '事件查询参数不合法',
      data: parsed.error.flatten()
    })
  }

  const { limit, ownerId, cursorId, subscriptionId, keyword, commentMin, commentMax } = parsed.data

  return {
    ok: true,
    data: listHitsPage({
      limit,
      ownerId,
      cursorId,
      subscriptionId,
      keyword,
      commentMin,
      commentMax
    })
  }
})
