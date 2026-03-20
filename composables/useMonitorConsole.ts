import type {
  HitRecord,
  MatchMode,
  MetricsSnapshot,
  MonitorStatus,
  NotifierTestResult,
  NotifyChannel,
  PageSection,
  RulePreviewResult,
  SubscriptionRecord,
  SubscriptionUpsertPayload,
  SubscriptionVersionRecord,
} from '~/types/monitor-console'
import { normalizeKeywords, parseLines, toInt } from '~/composables/monitor-console/utils'
import {
  formatDateTime,
  parseHeaders,
  parseRequestError,
  stringifyHeaders,
  versionActionLabel,
} from '~/composables/monitor-console/format'
import {
  createSubscriptionApi,
  deleteSubscriptionApi,
  fetchHitsApi,
  fetchMetricsApi,
  fetchSettingsApi,
  fetchStatusApi,
  fetchSubscriptionVersionsApi,
  fetchSubscriptionsApi,
  previewRuleApi,
  rollbackSubscriptionApi,
  runMonitorNowApi,
  saveSettingsApi,
  testNotifierApi,
  updateSubscriptionApi,
} from '~/composables/monitor-console/http'

export function useMonitorConsole() {
  const sectionOptions: Array<{ id: PageSection; label: string; description: string }> = [
    { id: 'overview', label: '总览', description: '运行状态、设置与指标' },
    { id: 'rules', label: '规则管理', description: '订阅、关键词、模拟命中' },
    { id: 'events', label: '事件中心', description: '命中记录与追踪' }
  ]

  const activeSection = ref<PageSection>('overview')

  const loading = ref(false)
  const savingSettings = ref(false)
  const savingSubscription = ref(false)
  const runningMonitor = ref(false)
  const previewingRule = ref(false)
  const testingNotifier = ref(false)

  const message = ref('')
  const errorMessage = ref('')

  const activeOwnerId = ref('default')

  const subscriptions = ref<SubscriptionRecord[]>([])
  const hits = ref<HitRecord[]>([])
  const hitsNextCursor = ref<number | null>(null)
  const hitsHasMore = ref(false)
  const loadingMoreHits = ref(false)
  const metrics = ref<MetricsSnapshot | null>(null)
  const rulePreviewResult = ref<RulePreviewResult | null>(null)
  const notifierTestResult = ref<NotifierTestResult | null>(null)
  const versionHistory = ref<SubscriptionVersionRecord[]>([])
  const versionTargetSubscriptionId = ref<number | null>(null)
  const loadingVersions = ref(false)
  const rollingBackVersionId = ref<number | null>(null)

  const monitorStatus = ref<MonitorStatus>({
    running: false,
    lastRunAt: null,
    lastSummary: null,
    lastError: null,
    runPhase: null,
    lastSummaryParsed: null
  })

  const settingsForm = reactive({
    pollIntervalSeconds: 120,
    bootstrapSkipExisting: true,
    strictCommentFilter: true,
    maxSeenDays: 7,
    httpTimeoutMs: 12000,
    httpUserAgent: 'Mozilla/5.0 (compatible; smzdm-monitor/2.0; +https://www.smzdm.com/)',
    feedUrlsText: 'http://feed.smzdm.com',
    notifierConsole: true,
    notifierWebhook: false,
    notifierWebhookUrl: '',
    notifierWebhookTimeoutMs: 8000,
    notifierWebhookHeadersText: ''
  })

  const subscriptionForm = reactive({
    id: null as number | null,
    ownerId: 'default',
    name: '',
    keywords: [] as string[],
    excludeKeywords: [] as string[],
    matchMode: 'any' as MatchMode,
    minComments: 0,
    enabled: true
  })

  const rulePreviewForm = reactive({
    title: '',
    description: ''
  })

  const hitFilters = reactive({
    subscriptionId: '',
    keyword: '',
    commentMin: '',
    commentMax: '',
    limit: 50
  })

  const keywordDraft = ref('')
  const excludeKeywordDraft = ref('')

  const isEditingSubscription = computed(() => subscriptionForm.id !== null)

  const monitorSummaryText = computed(() => {
    if (monitorStatus.value.lastSummaryParsed) {
      return JSON.stringify(monitorStatus.value.lastSummaryParsed, null, 2)
    }
    return monitorStatus.value.lastSummary || '暂无'
  })

  const versionTargetSubscription = computed(() => {
    if (!versionTargetSubscriptionId.value) return null
    return subscriptions.value.find((item) => item.id === versionTargetSubscriptionId.value) || null
  })

  let noticeTimer: ReturnType<typeof setTimeout> | null = null
  let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

  function ownerIdOrDefault() {
    return activeOwnerId.value.trim() || 'default'
  }

  function selectedNotifierChannels(): NotifyChannel[] {
    const channels: NotifyChannel[] = []
    if (settingsForm.notifierConsole) channels.push('console')
    if (settingsForm.notifierWebhook) channels.push('webhook')
    return channels
  }

  function showMessage(text: string) {
    message.value = text
    if (noticeTimer) {
      clearTimeout(noticeTimer)
    }
    noticeTimer = setTimeout(() => {
      message.value = ''
    }, 2600)
  }

  function clearError() {
    errorMessage.value = ''
  }

  function addIncludeKeyword(rawValue?: string) {
    const source = rawValue ?? keywordDraft.value
    const items = parseLines(source)
    if (items.length === 0) return

    subscriptionForm.keywords = normalizeKeywords([...subscriptionForm.keywords, ...items])
    keywordDraft.value = ''
  }

  function addExcludeKeyword(rawValue?: string) {
    const source = rawValue ?? excludeKeywordDraft.value
    const items = parseLines(source)
    if (items.length === 0) return

    subscriptionForm.excludeKeywords = normalizeKeywords([...subscriptionForm.excludeKeywords, ...items])
    excludeKeywordDraft.value = ''
  }

  function removeIncludeKeyword(index: number) {
    subscriptionForm.keywords = subscriptionForm.keywords.filter((_, idx) => idx !== index)
  }

  function removeExcludeKeyword(index: number) {
    subscriptionForm.excludeKeywords = subscriptionForm.excludeKeywords.filter((_, idx) => idx !== index)
  }

  function onIncludeKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',' || event.key === '，') {
      event.preventDefault()
      addIncludeKeyword()
    }
  }

  function onExcludeKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',' || event.key === '，') {
      event.preventDefault()
      addExcludeKeyword()
    }
  }

  async function fetchSettings() {
    const data = await fetchSettingsApi()

    settingsForm.pollIntervalSeconds = data.pollIntervalSeconds
    settingsForm.bootstrapSkipExisting = data.bootstrapSkipExisting
    settingsForm.strictCommentFilter = data.strictCommentFilter
    settingsForm.maxSeenDays = data.maxSeenDays
    settingsForm.httpTimeoutMs = data.httpTimeoutMs
    settingsForm.httpUserAgent = data.httpUserAgent
    settingsForm.feedUrlsText = data.feedUrls.join('\n')

    settingsForm.notifierConsole = data.notifier.channels.includes('console')
    settingsForm.notifierWebhook = data.notifier.channels.includes('webhook')
    settingsForm.notifierWebhookUrl = data.notifier.webhook.url
    settingsForm.notifierWebhookTimeoutMs = data.notifier.webhook.timeoutMs
    settingsForm.notifierWebhookHeadersText = stringifyHeaders(data.notifier.webhook.headers)
  }

  async function fetchSubscriptions() {
    subscriptions.value = await fetchSubscriptionsApi(activeOwnerId.value)
  }

  async function fetchHits(options?: { reset?: boolean }) {
    const reset = options?.reset ?? true

    if (!reset) {
      loadingMoreHits.value = true
    }

    try {
      const page = await fetchHitsApi({
        ownerId: activeOwnerId.value.trim(),
        limit: hitFilters.limit,
        subscriptionId: hitFilters.subscriptionId,
        keyword: hitFilters.keyword,
        commentMin: hitFilters.commentMin,
        commentMax: hitFilters.commentMax,
        reset,
        cursorId: hitsNextCursor.value
      })

      hits.value = reset ? page.items : [...hits.value, ...page.items]
      hitsNextCursor.value = page.nextCursor
      hitsHasMore.value = page.hasMore
    } finally {
      if (!reset) {
        loadingMoreHits.value = false
      }
    }
  }

  async function fetchStatus() {
    monitorStatus.value = await fetchStatusApi()
  }

  async function fetchMetrics() {
    metrics.value = await fetchMetricsApi(activeOwnerId.value)
  }

  async function refreshPollingData() {
    await Promise.all([fetchStatus(), fetchHits(), fetchMetrics()])
  }

  async function refreshAll() {
    loading.value = true
    clearError()
    try {
      await Promise.all([fetchSettings(), fetchSubscriptions(), fetchHits(), fetchStatus(), fetchMetrics()])
    } catch (error) {
      errorMessage.value = parseRequestError(error)
    } finally {
      loading.value = false
    }
  }

  async function refreshOwnerScopedData() {
    loading.value = true
    clearError()
    try {
      await Promise.all([fetchSubscriptions(), fetchHits(), fetchStatus(), fetchMetrics()])
      resetSubscriptionForm()
      rulePreviewResult.value = null
      versionHistory.value = []
      versionTargetSubscriptionId.value = null
    } catch (error) {
      errorMessage.value = parseRequestError(error)
    } finally {
      loading.value = false
    }
  }

  async function applyHitFilters() {
    clearError()
    try {
      await fetchHits({ reset: true })
      showMessage('事件筛选已应用')
    } catch (error) {
      errorMessage.value = parseRequestError(error)
    }
  }

  async function loadMoreHits() {
    if (!hitsHasMore.value || !hitsNextCursor.value) {
      return
    }

    clearError()
    try {
      await fetchHits({ reset: false })
    } catch (error) {
      errorMessage.value = parseRequestError(error)
    }
  }

  async function resetHitFilters() {
    hitFilters.subscriptionId = ''
    hitFilters.keyword = ''
    hitFilters.commentMin = ''
    hitFilters.commentMax = ''
    hitFilters.limit = 50
    await applyHitFilters()
  }

  async function saveSettings() {
    savingSettings.value = true
    clearError()

    try {
      const feedUrls = parseLines(settingsForm.feedUrlsText)
      if (feedUrls.length === 0) {
        throw new Error('至少提供一个 RSS 地址')
      }

      await saveSettingsApi({
        pollIntervalSeconds: Math.max(toInt(settingsForm.pollIntervalSeconds, 120), 10),
        bootstrapSkipExisting: settingsForm.bootstrapSkipExisting,
        strictCommentFilter: settingsForm.strictCommentFilter,
        maxSeenDays: Math.max(toInt(settingsForm.maxSeenDays, 7), 1),
        httpTimeoutMs: Math.max(toInt(settingsForm.httpTimeoutMs, 12000), 3000),
        httpUserAgent: settingsForm.httpUserAgent.trim(),
        feedUrls,
        notifier: {
          channels: selectedNotifierChannels(),
          webhook: {
            enabled: settingsForm.notifierWebhook,
            url: settingsForm.notifierWebhookUrl.trim(),
            headers: parseHeaders(settingsForm.notifierWebhookHeadersText),
            timeoutMs: Math.max(toInt(settingsForm.notifierWebhookTimeoutMs, 8000), 1000)
          }
        }
      })

      await fetchSettings()
      showMessage('监控设置已保存')
    } catch (error) {
      errorMessage.value = parseRequestError(error)
    } finally {
      savingSettings.value = false
    }
  }

  async function testNotifier() {
    testingNotifier.value = true
    clearError()

    try {
      const channels = selectedNotifierChannels()
      if (channels.length === 0) {
        throw new Error('请至少启用一个通知通道再测试')
      }

      const result = await testNotifierApi({
        ownerId: ownerIdOrDefault(),
        channels,
        title: 'SMZDM Monitor 控制台测试消息',
        matchedKeywords: subscriptionForm.keywords.slice(0, 5)
      })

      notifierTestResult.value = result
      showMessage(`通知测试已完成：sent ${result.sent} / failed ${result.failed} / skipped ${result.skipped}`)
    } catch (error) {
      errorMessage.value = parseRequestError(error)
    } finally {
      testingNotifier.value = false
    }
  }

  async function fetchSubscriptionVersions(subscriptionId: number) {
    loadingVersions.value = true
    try {
      versionHistory.value = await fetchSubscriptionVersionsApi({
        subscriptionId,
        ownerId: activeOwnerId.value,
        limit: 30
      })
      versionTargetSubscriptionId.value = subscriptionId
    } finally {
      loadingVersions.value = false
    }
  }

  async function openSubscriptionVersions(subscriptionId: number) {
    clearError()
    try {
      await fetchSubscriptionVersions(subscriptionId)
    } catch (error) {
      errorMessage.value = parseRequestError(error)
    }
  }

  async function rollbackSubscriptionVersion(versionId: number) {
    if (!versionTargetSubscriptionId.value) {
      return
    }

    if (!window.confirm('确认回滚到该版本吗？当前规则会被覆盖。')) {
      return
    }

    clearError()
    rollingBackVersionId.value = versionId
    try {
      const restored = await rollbackSubscriptionApi({
        subscriptionId: versionTargetSubscriptionId.value,
        versionId
      })

      await Promise.all([fetchSubscriptions(), fetchMetrics(), fetchHits({ reset: true })])

      if (subscriptionForm.id === restored.id) {
        fillSubscriptionForm(restored)
      }

      await fetchSubscriptionVersions(restored.id)
      showMessage(`已回滚到版本 #${versionId}`)
    } catch (error) {
      errorMessage.value = parseRequestError(error)
    } finally {
      rollingBackVersionId.value = null
    }
  }

  function resetSubscriptionForm() {
    subscriptionForm.id = null
    subscriptionForm.ownerId = ownerIdOrDefault()
    subscriptionForm.name = ''
    subscriptionForm.keywords = []
    subscriptionForm.excludeKeywords = []
    subscriptionForm.matchMode = 'any'
    subscriptionForm.minComments = 0
    subscriptionForm.enabled = true

    keywordDraft.value = ''
    excludeKeywordDraft.value = ''
  }

  function fillSubscriptionForm(record: SubscriptionRecord) {
    subscriptionForm.id = record.id
    subscriptionForm.ownerId = record.ownerId
    subscriptionForm.name = record.name
    subscriptionForm.keywords = [...record.keywords]
    subscriptionForm.excludeKeywords = [...record.excludeKeywords]
    subscriptionForm.matchMode = record.matchMode
    subscriptionForm.minComments = record.minComments
    subscriptionForm.enabled = record.enabled

    keywordDraft.value = ''
    excludeKeywordDraft.value = ''
    rulePreviewResult.value = null
  }

  function buildSubscriptionPayload(): SubscriptionUpsertPayload {
    return {
      ownerId: subscriptionForm.ownerId.trim() || 'default',
      name: subscriptionForm.name.trim(),
      keywords: normalizeKeywords(subscriptionForm.keywords),
      excludeKeywords: normalizeKeywords(subscriptionForm.excludeKeywords),
      matchMode: subscriptionForm.matchMode,
      minComments: Math.max(toInt(subscriptionForm.minComments, 0), 0),
      enabled: subscriptionForm.enabled
    }
  }

  async function submitSubscription() {
    savingSubscription.value = true
    clearError()

    try {
      const payload = buildSubscriptionPayload()
      if (payload.keywords.length === 0) {
        throw new Error('请至少添加一个关键词')
      }

      let targetSubscriptionId: number | null = subscriptionForm.id

      if (subscriptionForm.id === null) {
        const created = await createSubscriptionApi(payload)
        targetSubscriptionId = created.id
        showMessage('订阅已创建')
      } else {
        const updated = await updateSubscriptionApi(subscriptionForm.id, payload)
        targetSubscriptionId = updated.id
        showMessage('订阅已更新')
      }

      resetSubscriptionForm()
      rulePreviewResult.value = null
      await Promise.all([fetchSubscriptions(), fetchMetrics()])

      if (targetSubscriptionId) {
        await fetchSubscriptionVersions(targetSubscriptionId)
      }
    } catch (error) {
      errorMessage.value = parseRequestError(error)
    } finally {
      savingSubscription.value = false
    }
  }

  async function previewRule() {
    previewingRule.value = true
    clearError()

    try {
      const title = rulePreviewForm.title.trim()
      if (!title) {
        throw new Error('请输入模拟标题')
      }

      const keywords = normalizeKeywords(subscriptionForm.keywords)
      if (keywords.length === 0) {
        throw new Error('请先添加至少一个关键词')
      }

      rulePreviewResult.value = await previewRuleApi({
        title,
        description: rulePreviewForm.description.trim(),
        keywords,
        excludeKeywords: normalizeKeywords(subscriptionForm.excludeKeywords),
        matchMode: subscriptionForm.matchMode
      })

      showMessage(`规则模拟完成：${rulePreviewResult.value.matched ? '命中' : '未命中'}`)
    } catch (error) {
      errorMessage.value = parseRequestError(error)
    } finally {
      previewingRule.value = false
    }
  }

  async function removeSubscription(id: number) {
    if (!window.confirm('确认删除该订阅吗？该订阅对应去重索引也会一起删除。')) {
      return
    }

    clearError()
    try {
      const shouldClearVersionPanel = versionTargetSubscriptionId.value === id
      await deleteSubscriptionApi(id)

      if (subscriptionForm.id === id) {
        resetSubscriptionForm()
      }

      if (shouldClearVersionPanel) {
        versionTargetSubscriptionId.value = null
        versionHistory.value = []
      }

      await Promise.all([fetchSubscriptions(), fetchMetrics(), fetchHits({ reset: true })])
      showMessage('订阅已删除')
    } catch (error) {
      errorMessage.value = parseRequestError(error)
    }
  }

  async function runMonitorNow() {
    runningMonitor.value = true
    clearError()
    try {
      await runMonitorNowApi()
      await refreshPollingData()
      showMessage('手动扫描已执行')
    } catch (error) {
      errorMessage.value = parseRequestError(error)
    } finally {
      runningMonitor.value = false
    }
  }

  onMounted(async () => {
    resetSubscriptionForm()
    await refreshAll()

    autoRefreshTimer = setInterval(() => {
      void refreshPollingData().catch(() => {
        // ignore transient polling errors
      })
    }, 15000)
  })

  onBeforeUnmount(() => {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer)
    }
    if (noticeTimer) {
      clearTimeout(noticeTimer)
    }
  })

  return {
    sectionOptions,
    activeSection,
    loading,
    savingSettings,
    savingSubscription,
    runningMonitor,
    previewingRule,
    testingNotifier,
    message,
    errorMessage,
    activeOwnerId,
    subscriptions,
    hits,
    hitsNextCursor,
    hitsHasMore,
    loadingMoreHits,
    metrics,
    rulePreviewResult,
    notifierTestResult,
    versionHistory,
    versionTargetSubscriptionId,
    loadingVersions,
    rollingBackVersionId,
    monitorStatus,
    settingsForm,
    subscriptionForm,
    rulePreviewForm,
    hitFilters,
    keywordDraft,
    excludeKeywordDraft,
    isEditingSubscription,
    monitorSummaryText,
    versionTargetSubscription,
    versionActionLabel,
    formatDateTime,
    onIncludeKeydown,
    onExcludeKeydown,
    addIncludeKeyword,
    addExcludeKeyword,
    removeIncludeKeyword,
    removeExcludeKeyword,
    refreshAll,
    refreshOwnerScopedData,
    saveSettings,
    testNotifier,
    openSubscriptionVersions,
    rollbackSubscriptionVersion,
    resetSubscriptionForm,
    fillSubscriptionForm,
    submitSubscription,
    previewRule,
    removeSubscription,
    runMonitorNow,
    applyHitFilters,
    resetHitFilters,
    loadMoreHits
  }
}
