import { getMonitorConfig } from '~/server/utils/db'

export default defineEventHandler(() => {
  return {
    ok: true,
    data: getMonitorConfig()
  }
})
