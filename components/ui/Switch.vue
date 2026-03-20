<script setup lang="ts">
const model = defineModel<boolean>({ default: false })

const props = withDefaults(
  defineProps<{
    disabled?: boolean
  }>(),
  {
    disabled: false
  }
)

function toggle() {
  if (props.disabled) return
  model.value = !model.value
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    :disabled="props.disabled"
    class="relative inline-flex h-6 w-11 items-center rounded-full transition"
    :class="model ? 'bg-slate-900' : 'bg-slate-300'"
    @click="toggle"
  >
    <span
      class="inline-block h-5 w-5 transform rounded-full bg-white transition"
      :class="model ? 'translate-x-5' : 'translate-x-1'"
    />
  </button>
</template>
