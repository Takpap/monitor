<script setup lang="ts">
type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'danger'

const props = withDefaults(
  defineProps<{
    variant?: BadgeVariant
  }>(),
  {
    variant: 'default'
  }
)

const classes: Record<BadgeVariant, string> = {
  default: 'bg-slate-900 text-white',
  secondary: 'bg-slate-200 text-slate-900',
  success: 'bg-emerald-600 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-rose-600 text-white'
}
</script>

<template>
  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold" :class="classes[props.variant]">
    <slot />
  </span>
</template>
