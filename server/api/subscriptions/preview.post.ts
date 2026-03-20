import { evaluateTextRule } from '~/server/utils/rule-evaluator'
import { subscriptionPreviewSchema } from '~/server/utils/validators'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = subscriptionPreviewSchema.safeParse(body ?? {})

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: '规则预览参数不合法',
      data: parsed.error.flatten()
    })
  }

  return {
    ok: true,
    data: evaluateTextRule(parsed.data)
  }
})
