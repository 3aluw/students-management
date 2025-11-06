import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'

export function useConfirmHandler<T>(
  actionFn: (item: T) => Promise<void>,
  onAfterAction?: () => Promise<void>,
  successMsg = 'تمت العملية بنجاح',
  errorMsg = 'حدث خطأ أثناء العملية'
) {
  const toast = useToast()
  const showConfirm = ref(false)
  const targetItem = ref<T | null>(null)
  const loading = ref(false)

  const requestAction = (item: T) => {
    targetItem.value = item
    showConfirm.value = true
  }

  const confirmAction = async (confirmed: boolean) => {
    if (!confirmed || !targetItem.value) return reset()

    loading.value = true
    try {
      await actionFn(targetItem.value)
      if (onAfterAction) await onAfterAction()
      toast.add({ severity: 'success', summary: successMsg, life: 3000 })
    } catch {
      toast.add({ severity: 'error', summary: errorMsg, life: 3000 })
    } finally {
      loading.value = false
      reset()
    }
  }

  const reset = () => {
    showConfirm.value = false
    targetItem.value = null
  }

  return {
    showConfirm,
    targetItem,
    loading,
    requestAction,
    confirmAction,
  }
}
