<script setup lang="ts">
import type { useMonitorConsole } from '~/composables/useMonitorConsole'

defineProps<{
  vm: ReturnType<typeof useMonitorConsole>
}>()
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-3">
    <UiCard class="space-y-3 lg:col-span-1">
      <h2 class="text-lg font-semibold text-slate-900">运行状态</h2>
      <div class="flex items-center gap-3 rounded-lg bg-white/50 p-2.5 shadow-sm border border-slate-100">
        <div :class="['pulse-indicator', vm.monitorStatus.running ? 'warning' : '']">
          <span></span>
          <span></span>
        </div>
        <div class="flex flex-col">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">系统状态</span>
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-slate-700">
              {{ vm.monitorStatus.running ? '任务执行中' : '服务正常运行' }}
            </span>
            <UiBadge variant="secondary" class="h-5 px-1.5 text-[10px]">
              队列 {{ vm.monitorStatus.queue?.pending || 0 }}/{{ vm.monitorStatus.queue?.running || 0 }}
            </UiBadge>
          </div>
        </div>
      </div>
      <div class="space-y-1 text-sm text-slate-700">
        <p><span class="text-slate-500">最近执行：</span>{{ vm.formatDateTime(vm.monitorStatus.lastRunAt) }}</p>
        <p><span class="text-slate-500">最近错误：</span>{{ vm.monitorStatus.lastError || '无' }}</p>
        <p><span class="text-slate-500">运行阶段：</span>{{ vm.monitorStatus.runPhase || 'idle' }}</p>
        <p><span class="text-slate-500">统计生成：</span>{{ vm.formatDateTime(vm.metrics?.generatedAt || null) }}</p>
      </div>
      <div class="grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-3 text-xs text-slate-700">
        <p>订阅总数：{{ vm.metrics?.subscriptionsTotal ?? 0 }}</p>
        <p>启用订阅：{{ vm.metrics?.subscriptionsEnabled ?? 0 }}</p>
        <p>命中总数：{{ vm.metrics?.hitsTotal ?? 0 }}</p>
        <p>24h 命中：{{ vm.metrics?.hits24h ?? 0 }}</p>
        <p>24h 通知失败：{{ vm.metrics?.deliveryFailed24h ?? 0 }}</p>
        <p>通知队列：{{ vm.metrics?.queuePending ?? 0 }}/{{ vm.metrics?.queueRunning ?? 0 }}</p>
      </div>
      <div class="rounded-md bg-slate-50 p-3 border border-slate-100">
        <div class="mb-2 flex items-center justify-between">
          <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">最近执行摘要</p>
          <span class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
            <span class="h-1 w-1 rounded-full bg-blue-500 animate-pulse"></span>
            Live
          </span>
        </div>
        <div v-if="vm.monitorStatus.lastSummaryParsed" class="grid grid-cols-2 gap-y-2 text-xs text-slate-600">
          <div><span class="text-slate-400">模式：</span>{{ vm.monitorStatus.lastSummaryParsed.trigger === 'auto' ? '自动轮询' : '手动触发' }}</div>
          <div><span class="text-slate-400">扫描条目：</span>{{ vm.monitorStatus.lastSummaryParsed.scannedItems }} 条</div>
          <div><span class="text-slate-400">匹配规则：</span>{{ vm.monitorStatus.lastSummaryParsed.matchedRules }} 次</div>
          <div><span class="text-slate-400">发送通知：</span>{{ vm.monitorStatus.lastSummaryParsed.notified }} 次</div>
          <div v-if="vm.monitorStatus.lastSummaryParsed.bootstrapIndexed"><span class="text-slate-400">索引初始化：</span>{{ vm.monitorStatus.lastSummaryParsed.bootstrapIndexed }} 条</div>
          <div class="col-span-2 text-[10px] text-slate-400 italic mt-1">{{ vm.monitorStatus.lastSummaryParsed.note || '' }}</div>
        </div>
        <pre v-else class="overflow-x-auto text-[10px] text-slate-500 font-mono">{{ vm.monitorStatus.lastSummary || '暂无数据' }}</pre>
      </div>
    </UiCard>

    <UiCard class="space-y-4 lg:col-span-2">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">监控设置</h2>
        <p class="text-sm text-slate-500">保存后下一个轮询周期自动生效</p>
      </div>

      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="vm.saveSettings">
        <div>
          <UiLabel>轮询间隔（秒）</UiLabel>
          <UiInput v-model="vm.settingsForm.pollIntervalSeconds" type="number" min="10" />
        </div>

        <div>
          <UiLabel>请求超时（毫秒）</UiLabel>
          <UiInput v-model="vm.settingsForm.httpTimeoutMs" type="number" min="3000" />
        </div>

        <div>
          <UiLabel>去重保留天数</UiLabel>
          <UiInput v-model="vm.settingsForm.maxSeenDays" type="number" min="1" />
        </div>

        <div class="flex items-end gap-6 pb-1">
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <UiSwitch v-model="vm.settingsForm.bootstrapSkipExisting" />
            首轮仅索引不推送
          </label>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <UiSwitch v-model="vm.settingsForm.strictCommentFilter" />
            评论数严格过滤
          </label>
        </div>

        <div class="md:col-span-2">
          <UiLabel>User Agent</UiLabel>
          <UiTextarea v-model="vm.settingsForm.httpUserAgent" :rows="2" />
        </div>

        <div class="md:col-span-2">
          <UiLabel>RSS 地址（逗号或换行分隔）</UiLabel>
          <UiTextarea v-model="vm.settingsForm.feedUrlsText" :rows="3" placeholder="http://feed.smzdm.com" />
        </div>

        <div class="md:col-span-2 rounded-md border border-slate-200 p-3">
          <p class="mb-2 text-sm font-semibold text-slate-800">通知通道</p>
          <div class="mb-3 flex flex-wrap items-center gap-6">
            <label class="flex items-center gap-2 text-sm text-slate-700">
              <UiSwitch v-model="vm.settingsForm.notifierConsole" />
              Console 通道
            </label>
            <label class="flex items-center gap-2 text-sm text-slate-700">
              <UiSwitch v-model="vm.settingsForm.notifierWebhook" />
              Webhook 通道
            </label>
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <div class="md:col-span-2">
              <UiLabel>Webhook URL</UiLabel>
              <UiInput v-model="vm.settingsForm.notifierWebhookUrl" placeholder="https://example.com/hook" />
            </div>
            <div>
              <UiLabel>Webhook Timeout (ms)</UiLabel>
              <UiInput v-model="vm.settingsForm.notifierWebhookTimeoutMs" type="number" min="1000" />
            </div>
            <div class="md:col-span-2">
              <UiLabel>Webhook Headers（每行 key: value）</UiLabel>
              <UiTextarea v-model="vm.settingsForm.notifierWebhookHeadersText" :rows="3" />
            </div>
          </div>
        </div>

        <div class="md:col-span-2 flex flex-wrap gap-2">
          <UiButton type="submit" :disabled="vm.savingSettings">{{ vm.savingSettings ? '保存中...' : '保存设置' }}</UiButton>
          <UiButton type="button" variant="outline" :disabled="vm.testingNotifier" @click="vm.testNotifier">
            {{ vm.testingNotifier ? '测试中...' : '测试通知通道' }}
          </UiButton>
        </div>
      </form>

      <div v-if="vm.notifierTestResult" class="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
        <p class="font-medium text-slate-800">
          通知测试结果：sent {{ vm.notifierTestResult.sent }} / failed {{ vm.notifierTestResult.failed }} / skipped {{ vm.notifierTestResult.skipped }}
        </p>
        <div class="mt-2 flex flex-wrap gap-2 text-xs">
          <UiBadge
            v-for="item in vm.notifierTestResult.results"
            :key="`${item.channel}-${item.status}-${item.errorMessage || 'none'}`"
            :variant="item.status === 'sent' ? 'success' : item.status === 'failed' ? 'danger' : 'secondary'"
          >
            {{ item.channel }}: {{ item.status }}{{ item.errorMessage ? ` (${item.errorMessage})` : '' }}
          </UiBadge>
        </div>
      </div>
    </UiCard>
  </div>
</template>
