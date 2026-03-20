import { listSubscriptions } from '~/server/utils/db'
import { getQuery } from 'h3'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const ownerId = String(query.ownerId || '').trim() || undefined

  return {
    ok: true,
    data: listSubscriptions({ ownerId })
  }
})
