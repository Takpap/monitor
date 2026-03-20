<script setup lang="ts">
import { useMonitorConsole } from '~/composables/useMonitorConsole'

useHead({
  title: 'SMZDM Monitor Console'
})

const vm = useMonitorConsole()
</script>

<template>
  <main class="min-h-screen bg-slate-100 py-6 md:py-8">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 md:px-6">
      <header class="flex flex-col gap-4">
        <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 class="text-2xl font-bold text-slate-900">SMZDM 监控台</h1>
            <p class="mt-1 text-sm text-slate-600">多 owner、多通道通知、规则可视化管理</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <UiButton variant="secondary" :disabled="vm.loading" @click="vm.refreshAll">刷新数据</UiButton>
            <UiButton :disabled="vm.runningMonitor" @click="vm.runMonitorNow">{{ vm.runningMonitor ? '扫描中...' : '手动扫描' }}</UiButton>
          </div>
        </div>

        <div class="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 md:flex-row md:items-end md:justify-between">
          <div class="flex w-full flex-col gap-2 md:max-w-xs">
            <UiLabel>Owner 作用域（留空=全部）</UiLabel>
            <UiInput :model-value="vm.activeOwnerId.value" @update:model-value="vm.activeOwnerId.value = $event" placeholder="default" />
          </div>
          <div class="flex items-center gap-2">
            <UiButton variant="outline" @click="vm.refreshOwnerScopedData">应用作用域</UiButton>
          </div>
          <p class="text-xs text-slate-500">当前查询命中、订阅和 metrics 都会按 ownerId 过滤</p>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-3">
          <div class="grid gap-2 md:grid-cols-3">
            <UiButton
              v-for="section in vm.sectionOptions"
              :key="section.id"
              :variant="vm.activeSection === section.id ? 'default' : 'outline'"
              class="justify-start"
              @click="vm.activeSection = section.id"
            >
              {{ section.label }}
            </UiButton>
          </div>
          <p class="mt-2 text-xs text-slate-500">
            {{ vm.sectionOptions.find((item) => item.id === vm.activeSection)?.description }}
          </p>
        </div>
      </header>

      <p v-if="vm.message" class="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        {{ vm.message }}
      </p>
      <p v-if="vm.errorMessage" class="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {{ vm.errorMessage }}
      </p>

      <MonitorOverviewPanel v-if="vm.activeSection === 'overview'" :vm="vm" />
      <MonitorRulesPanel v-else-if="vm.activeSection === 'rules'" :vm="vm" />
      <MonitorEventsPanel v-else :vm="vm" />
    </div>
  </main>
</template>
