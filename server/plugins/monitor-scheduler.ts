import { getMonitorConfig } from '~/server/utils/db'
import { runMonitorCycle } from '~/server/utils/monitor'

declare global {
  // eslint-disable-next-line no-var
  var __smzdmSchedulerStarted: boolean | undefined
  // eslint-disable-next-line no-var
  var __smzdmSchedulerTimer: ReturnType<typeof setTimeout> | undefined
}

export default defineNitroPlugin(() => {
  if (process.env.DISABLE_MONITOR_SCHEDULER === '1') {
    console.log('[monitor] 自动轮询已通过 DISABLE_MONITOR_SCHEDULER=1 禁用')
    return
  }

  if (globalThis.__smzdmSchedulerStarted) {
    return
  }
  globalThis.__smzdmSchedulerStarted = true

  const scheduleNext = () => {
    const config = getMonitorConfig()
    const delayMs = Math.max(config.pollIntervalSeconds, 10) * 1000

    globalThis.__smzdmSchedulerTimer = setTimeout(async () => {
      try {
        await runMonitorCycle('auto')
      } catch (error) {
        console.error('[monitor] 自动轮询执行失败:', error)
      } finally {
        scheduleNext()
      }
    }, delayMs)
  }

  void runMonitorCycle('auto')
    .catch((error) => {
      console.error('[monitor] 启动首次扫描失败:', error)
    })
    .finally(() => {
      scheduleNext()
    })
})
