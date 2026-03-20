import type { Database } from 'bun:sqlite'
import { nowIso } from './helpers'
import type { Subscription, SubscriptionVersionAction } from './types'

export function addSubscriptionVersionRecord(
  db: Database,
  input: {
    subscriptionId: number
    ownerId: string
    action: SubscriptionVersionAction
    snapshot: Subscription
  }
) {
  db
    .query(`
      INSERT INTO subscription_versions (subscription_id, owner_id, action, snapshot, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      input.subscriptionId,
      input.ownerId,
      input.action,
      JSON.stringify(input.snapshot),
      nowIso()
    )
}
