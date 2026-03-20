<script setup lang="ts">
type ButtonVariant = 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost'
type ButtonSize = 'default' | 'sm' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'default',
    size: 'default',
    type: 'button'
  }
)

const variantClass: Record<ButtonVariant, string> = {
  default: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  outline: 'border border-slate-300 text-slate-900 hover:bg-slate-100',
  destructive: 'bg-rose-600 text-white hover:bg-rose-500',
  ghost: 'text-slate-700 hover:bg-slate-100'
}

const sizeClass: Record<ButtonSize, string> = {
  default: 'h-10 px-4 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-11 px-6 text-base'
}

const classes = computed(() => {
  return [
    'inline-flex items-center justify-center rounded-md font-medium transition-colors',
    'disabled:pointer-events-none disabled:opacity-50',
    variantClass[props.variant],
    sizeClass[props.size]
  ]
})
</script>

<template>
  <button :type="type" :class="classes">
    <slot />
  </button>
</template>
