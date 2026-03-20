<script setup lang="ts">
const model = defineModel<string>({ default: '' })

const props = withDefaults(
  defineProps<{
    placeholder?: string
    rows?: number
    disabled?: boolean
  }>(),
  {
    placeholder: '',
    rows: 3,
    disabled: false
  }
)
</script>

<template>
  <textarea
    v-model="model"
    :placeholder="props.placeholder"
    :rows="props.rows"
    :disabled="props.disabled"
    class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-700"
  />
</template>
