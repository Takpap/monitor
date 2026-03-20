import { createSubscription } from '~/server/utils/db'
import { subscriptionCreateSchema } from '~/server/utils/validators'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = subscriptionCreateSchema.safeParse(body ?? {})

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: '订阅参数不合法',
      data: parsed.error.flatten()
    })
  }

  const record = createSubscription(parsed.data)
  return {
    ok: true,
    data: record
  }
})
