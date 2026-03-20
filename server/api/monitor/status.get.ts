import { getMonitorRuntimeState } from '~/server/utils/monitor'

export default defineEventHandler(() => {
  const runtime = getMonitorRuntimeState()
  let lastSummaryParsed: Record<string, any> | null = null

  if (runtime.lastSummary) {
    try {
      lastSummaryParsed = JSON.parse(runtime.lastSummary)
    } catch {
      lastSummaryParsed = null
    }
  }

  return {
    ok: true,
    data: {
      ...runtime,
      lastSummaryParsed
    }
  }
})
