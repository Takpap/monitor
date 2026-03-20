<script setup lang="ts">
const model = defineModel<string | number>({ default: '' })

const props = withDefaults(
  defineProps<{
    type?: string
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    type: 'text',
    placeholder: '',
    disabled: false
  }
)
</script>

<template>
  <input
    v-model="model"
    :type="props.type"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    class="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-700"
  />
</template>
