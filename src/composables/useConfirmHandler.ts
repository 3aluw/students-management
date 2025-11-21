import { useToast } from "primevue/usetoast";

export function useConfirmHandler<
  T,
  A1 extends unknown[] | [] = [],  // args for actionFn
  A2 extends unknown[] | [] = []   // args for onAfterAction
>(
  actionFn: (item: T, ...args: A1) => Promise<void>,
  onAfterAction?: (...args: A2) => Promise<unknown>,
  successMsg = 'تمت العملية بنجاح',
  errorMsg = 'حدث خطأ أثناء العملية'
) {
  const toast = useToast()
  const showConfirm = ref(false)
  const targetItem = ref<T | null>(null)
  const loading = ref(false)

  const argsRefAction = ref<A1 | []>([])  // separate args
  const argsRefAfter  = ref<A2 | []>([])

  const requestAction = (
    item: T,
    actionArgs?: A1,
    afterArgs?: A2
  ) => {
    targetItem.value = item
    argsRefAction.value = actionArgs ?? ([] as A1)
    argsRefAfter.value = afterArgs ?? ([] as A2)
    showConfirm.value = true
  }

  const confirmAction = async (confirmed: boolean) => {
    if (!confirmed || !targetItem.value) return reset()

    loading.value = true
    try {
      await actionFn(targetItem.value, ...argsRefAction.value)
      if (onAfterAction)
        await onAfterAction(...argsRefAfter.value)

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
    argsRefAction.value = [] as A1
    argsRefAfter.value = [] as A2
  }

  return {
    showConfirm,
    targetItem,
    loading,
    requestAction,
    confirmAction,
  }
}
