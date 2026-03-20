import { type MonitorConfig } from './db'
import { notifyHit, type HitNotificationPayload } from './notifier'

interface NotificationJob {
  payload: HitNotificationPayload
  config: MonitorConfig
  retry: number
}

const MAX_CONCURRENCY = 2
const MAX_RETRY = 2

const queue: NotificationJob[] = []
let running = 0

function nowPending() {
  return queue.length
}

function runNext() {
  while (running < MAX_CONCURRENCY && queue.length > 0) {
    const job = queue.shift()
    if (!job) continue

    running += 1
    void notifyHit(job.payload, job.config)
      .catch((error) => {
        if (job.retry < MAX_RETRY) {
          setTimeout(() => {
            queue.push({ ...job, retry: job.retry + 1 })
            runNext()
          }, 500 * (job.retry + 1))
        } else {
          console.error('[notify:queue] drop job after retries:', error)
        }
      })
      .finally(() => {
        running -= 1
        runNext()
      })
  }
}

export function enqueueNotification(payload: HitNotificationPayload, config: MonitorConfig) {
  queue.push({ payload, config, retry: 0 })
  runNext()
}

export function getNotificationQueueState() {
  return {
    pending: nowPending(),
    running
  }
}
