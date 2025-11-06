<template>
  <Dialog
    :header="header"
    v-model:visible="visible"
    :modal="true"
    :style="dialogStyle"
  >
    <div class="flex items-center justify-center text-center">
      <i class="pi pi-exclamation-triangle mr-4" style="font-size: 2rem" />
      <span>{{ message }}</span>
    </div>

    <template #footer>
      <Button
        :label="cancelLabel"
        icon="pi pi-times"
        @click="onCancel"
        text
        severity="secondary"
      />
      <Button
        :label="confirmLabel"
        icon="pi pi-check"
        @click="onConfirm"
        :severity="danger ? 'danger' : 'primary'"
        :outlined="danger"
        autofocus
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// Props
const props = defineProps({
  modelValue: { type: Boolean, required: true },     // controls open state
  header: { type: String, default: 'تأكيد' },
  message: { type: String, default: 'هل أنت متأكد من المواصلة ؟' },
  danger: { type: Boolean, default: false },
  confirmLabel: { type: String, default: 'نعم' },
  cancelLabel: { type: String, default: 'لا' },
  width: { type: String, default: '350px' },
})

// Emits
const emit = defineEmits(['update:modelValue', 'confirm'])

// Local state mirror for Dialog v-model
const visible = ref(props.modelValue)

watch(
  () => props.modelValue,
  (val) => (visible.value = val)
)

watch(visible, (val) => emit('update:modelValue', val))

const dialogStyle = computed(() => ({ width: props.width }))

const onConfirm = () => {
  emit('confirm', true)
  visible.value = false
}

const onCancel = () => {
  emit('confirm', false)
  visible.value = false
}
</script>
