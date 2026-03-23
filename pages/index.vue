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

      <div class="h-10">
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform translate-y-2 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div v-if="vm.message" class="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 shadow-sm">
            <div class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
               <svg class="h-3 w-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            {{ vm.message }}
          </div>
          <div v-else-if="vm.errorMessage" class="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 shadow-sm">
            <div class="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100">
               <svg class="h-3 w-3 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
            </div>
            {{ vm.errorMessage }}
          </div>
        </Transition>
      </div>

      <div class="relative">
        <Transition
          mode="out-in"
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform translate-y-4 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="transform -translate-y-2 opacity-0"
        >
          <div :key="vm.activeSection">
            <MonitorOverviewPanel v-if="vm.activeSection === 'overview'" :vm="vm" />
            <MonitorRulesPanel v-else-if="vm.activeSection === 'rules'" :vm="vm" />
            <MonitorEventsPanel v-else :vm="vm" />
          </div>
        </Transition>
      </div>
    </div>
  </main>
</template>
