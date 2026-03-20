import { deleteSubscription } from '~/server/utils/db'
import { parsePositiveRouteParam } from '~/server/utils/http'

export default defineEventHandler((event) => {
  const id = parsePositiveRouteParam(event, 'id', '订阅 ID')
  deleteSubscription(id)

  return {
    ok: true
  }
})
