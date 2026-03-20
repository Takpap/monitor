import { setMonitorConfig } from '~/server/utils/db'
import { monitorSettingsUpdateSchema } from '~/server/utils/validators'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = monitorSettingsUpdateSchema.safeParse(body ?? {})

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: '设置参数不合法',
      data: parsed.error.flatten()
    })
  }

  const payload = { ...parsed.data }
  if (payload.feedUrls) {
    payload.feedUrls = Array.from(new Set(payload.feedUrls.map((url) => url.trim())))
  }
  if (payload.notifier?.channels) {
    payload.notifier.channels = Array.from(new Set(payload.notifier.channels))
  }
  if (payload.notifier?.webhook?.headers) {
    payload.notifier.webhook.headers = Object.fromEntries(
      Object.entries(payload.notifier.webhook.headers)
        .map(([key, value]) => [key.trim(), String(value).trim()])
        .filter(([key]) => Boolean(key))
    )
  }

  const config = setMonitorConfig(payload)
  return {
    ok: true,
    data: config
  }
})
