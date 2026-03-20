import { useDb } from './client'
import type { DeliveryRecord } from './types'

export function addDeliveryLog(input: Omit<DeliveryRecord, 'id'>) {
  const db = useDb()
  db
    .query(`
      INSERT INTO deliveries (hit_id, owner_id, channel, status, error_message, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(input.hitId, input.ownerId, input.channel, input.status, input.errorMessage, input.createdAt)
}
