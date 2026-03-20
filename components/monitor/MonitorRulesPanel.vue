<script setup lang="ts">
import type { useMonitorConsole } from '~/composables/useMonitorConsole'

defineProps<{
  vm: ReturnType<typeof useMonitorConsole>
}>()
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <UiCard class="space-y-4">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">{{ vm.isEditingSubscription ? '编辑订阅' : '新增订阅' }}</h2>
        <p class="text-sm text-slate-500">可视化关键词编辑，支持回车/逗号快速录入</p>
      </div>

      <form class="space-y-4" @submit.prevent="vm.submitSubscription">
        <div>
          <UiLabel>Owner ID</UiLabel>
          <UiInput v-model="vm.subscriptionForm.ownerId" placeholder="default" />
        </div>

        <div>
          <UiLabel>订阅名称</UiLabel>
          <UiInput v-model="vm.subscriptionForm.name" placeholder="例如：数码热榜" />
        </div>

        <div class="rounded-md border border-slate-200 p-3">
          <UiLabel>关键词（命中）</UiLabel>
          <div class="mt-2 flex gap-2">
            <UiInput
              v-model="vm.keywordDraft"
              placeholder="输入关键词后回车"
              @keydown="vm.onIncludeKeydown"
              @blur="vm.addIncludeKeyword()"
            />
            <UiButton type="button" variant="outline" @click="vm.addIncludeKeyword">添加</UiButton>
          </div>
          <div class="mt-2 flex flex-wrap gap-2">
            <UiBadge
              v-for="(keyword, index) in vm.subscriptionForm.keywords"
              :key="`in-${keyword}-${index}`"
              variant="secondary"
              class="cursor-pointer"
              @click="vm.removeIncludeKeyword(index)"
            >
              {{ keyword }} ×
            </UiBadge>
            <span v-if="vm.subscriptionForm.keywords.length === 0" class="text-xs text-slate-500">暂无关键词</span>
          </div>
        </div>

        <div class="rounded-md border border-slate-200 p-3">
          <UiLabel>排除关键词</UiLabel>
          <div class="mt-2 flex gap-2">
            <UiInput
              v-model="vm.excludeKeywordDraft"
              placeholder="输入排除词后回车"
              @keydown="vm.onExcludeKeydown"
              @blur="vm.addExcludeKeyword()"
            />
            <UiButton type="button" variant="outline" @click="vm.addExcludeKeyword">添加</UiButton>
          </div>
          <div class="mt-2 flex flex-wrap gap-2">
            <UiBadge
              v-for="(keyword, index) in vm.subscriptionForm.excludeKeywords"
              :key="`ex-${keyword}-${index}`"
              variant="secondary"
              class="cursor-pointer"
              @click="vm.removeExcludeKeyword(index)"
            >
              {{ keyword }} ×
            </UiBadge>
            <span v-if="vm.subscriptionForm.excludeKeywords.length === 0" class="text-xs text-slate-500">无排除词</span>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <UiLabel>匹配模式</UiLabel>
            <select
              v-model="vm.subscriptionForm.matchMode"
              class="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-700"
            >
              <option value="any">任一关键词</option>
              <option value="all">全部关键词</option>
            </select>
          </div>
          <div>
            <UiLabel>最低评论数</UiLabel>
            <UiInput v-model="vm.subscriptionForm.minComments" type="number" min="0" />
          </div>
        </div>

        <label class="flex items-center gap-2 text-sm text-slate-700">
          <UiSwitch v-model="vm.subscriptionForm.enabled" />
          启用该订阅
        </label>

        <div class="flex flex-wrap gap-2">
          <UiButton type="submit" :disabled="vm.savingSubscription">
            {{ vm.savingSubscription ? '提交中...' : (vm.isEditingSubscription ? '保存修改' : '创建订阅') }}
          </UiButton>
          <UiButton type="button" variant="outline" @click="vm.resetSubscriptionForm">重置</UiButton>
        </div>
      </form>

      <div class="rounded-md border border-slate-200 p-3">
        <p class="text-sm font-semibold text-slate-900">规则模拟命中</p>
        <p class="mt-1 text-xs text-slate-500">用当前表单规则对一段文本进行离线预览</p>
        <div class="mt-3 space-y-3">
          <div>
            <UiLabel>模拟标题</UiLabel>
            <UiInput v-model="vm.rulePreviewForm.title" placeholder="例如：iPhone 16 国补后新低" />
          </div>
          <div>
            <UiLabel>模拟描述（可选）</UiLabel>
            <UiTextarea v-model="vm.rulePreviewForm.description" :rows="3" placeholder="可粘贴商品摘要文本" />
          </div>
          <UiButton type="button" variant="outline" :disabled="vm.previewingRule" @click="vm.previewRule">
            {{ vm.previewingRule ? '模拟中...' : '模拟命中' }}
          </UiButton>
        </div>

        <div v-if="vm.rulePreviewResult" class="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
          <div class="mb-2 flex items-center gap-2">
            <UiBadge :variant="vm.rulePreviewResult.matched ? 'success' : 'secondary'">
              {{ vm.rulePreviewResult.matched ? '命中' : '未命中' }}
            </UiBadge>
            <UiBadge v-if="vm.rulePreviewResult.excluded" variant="danger">被排除词拦截</UiBadge>
          </div>
          <p class="text-xs text-slate-600">命中词：{{ vm.rulePreviewResult.matchedKeywords.join(', ') || '无' }}</p>
          <p class="text-xs text-slate-600">排除词：{{ vm.rulePreviewResult.excludedKeywords.join(', ') || '无' }}</p>
        </div>
      </div>
    </UiCard>

    <UiCard class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">订阅列表</h2>
        <UiBadge variant="secondary">{{ vm.subscriptions.length }} 条</UiBadge>
      </div>

      <div v-if="vm.subscriptions.length === 0" class="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
        暂无订阅，先在左侧创建一个。
      </div>

      <div v-else class="space-y-3">
        <article
          v-for="sub in vm.subscriptions"
          :key="sub.id"
          class="rounded-md border border-slate-200 p-3"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-slate-900">{{ sub.name }}</p>
              <p class="mt-1 text-xs text-slate-500">Owner {{ sub.ownerId }} · ID {{ sub.id }} · {{ sub.matchMode === 'any' ? '任一匹配' : '全部匹配' }}</p>
            </div>
            <div class="flex items-center gap-2">
              <UiBadge :variant="sub.enabled ? 'success' : 'secondary'">{{ sub.enabled ? '启用' : '停用' }}</UiBadge>
              <UiButton size="sm" variant="outline" @click="vm.fillSubscriptionForm(sub)">编辑</UiButton>
              <UiButton size="sm" variant="outline" @click="vm.openSubscriptionVersions(sub.id)">版本</UiButton>
              <UiButton size="sm" variant="destructive" @click="vm.removeSubscription(sub.id)">删除</UiButton>
            </div>
          </div>

          <div class="mt-2 space-y-1 text-xs text-slate-600">
            <p><span class="text-slate-400">关键词：</span>{{ sub.keywords.join(', ') }}</p>
            <p><span class="text-slate-400">排除词：</span>{{ sub.excludeKeywords.length ? sub.excludeKeywords.join(', ') : '无' }}</p>
            <p><span class="text-slate-400">热度阈值：</span>{{ sub.minComments }}</p>
          </div>
        </article>
      </div>

      <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
        <div class="mb-2 flex items-center justify-between">
          <p class="text-sm font-semibold text-slate-900">规则版本历史</p>
          <UiBadge variant="secondary">{{ vm.versionHistory.length }} 条</UiBadge>
        </div>

        <p class="text-xs text-slate-500">
          当前订阅：{{ vm.versionTargetSubscription ? `${vm.versionTargetSubscription.name} (#${vm.versionTargetSubscription.id})` : '未选择' }}
        </p>

        <div v-if="vm.loadingVersions" class="mt-2 text-xs text-slate-500">加载中...</div>
        <div v-else-if="vm.versionHistory.length === 0" class="mt-2 text-xs text-slate-500">暂无版本历史，先创建或更新一次规则。</div>
        <div v-else class="mt-2 space-y-2">
          <article
            v-for="version in vm.versionHistory"
            :key="version.id"
            class="rounded-md border border-slate-200 bg-white p-2"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="text-xs text-slate-600">
                <p>#{{ version.id }} · {{ vm.versionActionLabel(version.action) }} · {{ vm.formatDateTime(version.createdAt) }}</p>
                <p class="mt-1 text-slate-500">{{ version.snapshot.matchMode === 'any' ? '任一匹配' : '全部匹配' }} · 热度阈值 {{ version.snapshot.minComments }}</p>
              </div>
              <UiButton
                size="sm"
                variant="outline"
                :disabled="vm.rollingBackVersionId === version.id || !vm.versionTargetSubscriptionId"
                @click="vm.rollbackSubscriptionVersion(version.id)"
              >
                {{ vm.rollingBackVersionId === version.id ? '回滚中...' : '回滚' }}
              </UiButton>
            </div>
            <p class="mt-1 text-xs text-slate-500">关键词：{{ version.snapshot.keywords.join(', ') || '无' }}</p>
          </article>
        </div>
      </div>
    </UiCard>
  </div>
</template>
