<script setup lang="ts">
import type { useMonitorConsole } from '~/composables/useMonitorConsole'

defineProps<{
  vm: ReturnType<typeof useMonitorConsole>
}>()
</script>

<template>
  <UiCard class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-slate-900">命中记录</h2>
      <UiBadge variant="secondary">{{ vm.hits.length }} 条{{ vm.hitsHasMore ? '（可继续加载）' : '' }}</UiBadge>
    </div>

    <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <div>
          <UiLabel>订阅过滤</UiLabel>
          <select
            v-model="vm.hitFilters.subscriptionId"
            class="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-700"
          >
            <option value="">全部订阅</option>
            <option v-for="sub in vm.subscriptions" :key="`filter-sub-${sub.id}`" :value="String(sub.id)">
              #{{ sub.id }} {{ sub.name }}
            </option>
          </select>
        </div>
        <div>
          <UiLabel>关键词搜索</UiLabel>
          <UiInput v-model="vm.hitFilters.keyword" placeholder="标题/关键词模糊匹配" />
        </div>
        <div>
          <UiLabel>最小评论数</UiLabel>
          <UiInput v-model="vm.hitFilters.commentMin" type="number" min="0" />
        </div>
        <div>
          <UiLabel>最大评论数</UiLabel>
          <UiInput v-model="vm.hitFilters.commentMax" type="number" min="0" />
        </div>
        <div>
          <UiLabel>每页数量</UiLabel>
          <UiInput v-model="vm.hitFilters.limit" type="number" min="1" max="200" />
        </div>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <UiButton variant="outline" @click="vm.applyHitFilters">应用筛选</UiButton>
        <UiButton variant="secondary" @click="vm.resetHitFilters">重置筛选</UiButton>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th class="px-2 py-2">时间</th>
            <th class="px-2 py-2">Owner</th>
            <th class="px-2 py-2">订阅</th>
            <th class="px-2 py-2">标题</th>
            <th class="px-2 py-2">评论</th>
            <th class="px-2 py-2">关键词</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="hit in vm.hits" :key="hit.id" class="border-b border-slate-100 align-top">
            <td class="px-2 py-2 text-slate-500">{{ vm.formatDateTime(hit.createdAt) }}</td>
            <td class="px-2 py-2 text-slate-600">{{ hit.ownerId }}</td>
            <td class="px-2 py-2">
              <div class="font-medium text-slate-900">{{ hit.subscriptionName }}</div>
              <div class="text-xs text-slate-500">#{{ hit.subscriptionId }}</div>
            </td>
            <td class="px-2 py-2">
              <a :href="hit.link" target="_blank" class="line-clamp-2 text-slate-900 hover:underline">{{ hit.title }}</a>
            </td>
            <td class="px-2 py-2 text-slate-700">
              {{ hit.commentCount === null ? '未知' : hit.commentCount }} / {{ hit.minComments }}
            </td>
            <td class="px-2 py-2 text-slate-600">{{ (hit.matchedKeywords || []).join(', ') }}</td>
          </tr>
          <tr v-if="vm.hits.length === 0">
            <td colspan="6" class="px-2 py-6 text-center text-sm text-slate-500">暂无命中记录</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between">
      <p class="text-xs text-slate-500">游标：{{ vm.hitsNextCursor || '无' }}</p>
      <UiButton
        variant="outline"
        :disabled="!vm.hitsHasMore || vm.loadingMoreHits"
        @click="vm.loadMoreHits"
      >
        {{ vm.loadingMoreHits ? '加载中...' : (vm.hitsHasMore ? '加载更多' : '没有更多') }}
      </UiButton>
    </div>
  </UiCard>
</template>
