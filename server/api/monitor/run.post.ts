import { runMonitorCycle } from '~/server/utils/monitor'

export default defineEventHandler(async () => {
  const result = await runMonitorCycle('manual')
  return {
    ok: result.ok,
    data: result
  }
})
