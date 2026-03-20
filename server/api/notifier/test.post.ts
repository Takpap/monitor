import { getMonitorConfig } from '~/server/utils/db'
import { notifyTest } from '~/server/utils/notifier'
import { notifierTestSchema } from '~/server/utils/validators'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = notifierTestSchema.safeParse(body ?? {})

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: '通知测试参数不合法',
      data: parsed.error.flatten()
    })
  }

  const data = parsed.data
  const config = getMonitorConfig()
  const result = await notifyTest(config, {
    ...data,
    matchedKeywords: data.matchedKeywords ? Array.from(new Set(data.matchedKeywords)) : undefined,
    channels: data.channels ? Array.from(new Set(data.channels)) : undefined
  })

  return {
    ok: true,
    data: result
  }
})
