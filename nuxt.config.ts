export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', 'shadcn-nuxt'],
  css: ['~/assets/css/tailwind.css'],
  runtimeConfig: {
    monitorDbPath: process.env.MONITOR_DB_PATH || './data/monitor.db'
  },
  shadcn: {
    prefix: 'Ui',
    componentDir: './components/shadcn'
  },
  experimental: {
    appManifest: false
  },
  nitro: {
    preset: 'bun',
    experimental: {
      tasks: true
    }
  }
})
