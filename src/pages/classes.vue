<template>
  <div class="card">
    <div class="font-semibold text-xl mb-4">الأقسام
            <Button class="mx-4" icon="pi pi-plus" severity="contrast" text raised rounded />
    </div>
    <DataTable :value="studentStore.classes" scrollable scrollHeight="400px" class="mt-6">
      <Column field="level" header="المستوى" style="min-width: 200px" class="font-bold"></Column>
      <Column field="abbreviation" header="الحرف" style="min-width: 200px"> </Column>
      <Column header="تعديل" style="min-width: 50px">
        <template #body>
          <Button icon="pi pi-pencil" severity="secondary" rounded />
        </template>
      </Column>
      <Column header="حذف" style="min-width: 50px">
        <template #body="slotProps">
          <Button @click="handleDeleteClick(slotProps.data.id)" icon="pi pi-trash" severity="danger" rounded />
        </template>
      </Column>
    </DataTable>
    <UtilsConfirmDialog v-model="showConfirmDialog" :danger="true"
      message="هل أنت متأكد من رغبتك في حذف هذا القسم؟ كل تلاميذ القسم سيتم حذفهم تلقائيا"
      @confirm="handleConfirmDelete">
    </UtilsConfirmDialog>
  </div>

</template>
<script setup lang="ts">
import { Toast } from 'primevue';
import type { Class } from '~/data/types'
import { useStudentStore } from '~/store/studentStore';
const studentStore = useStudentStore()
const backend = useBackend()

const classToEdit = ref<Class | undefined>(undefined)
const classIdToDelete = ref<string | undefined>(undefined)

const handleDeleteClick = (classId: string) => {
  classIdToDelete.value = classId
  showConfirmDialog.value = true
}
const showConfirmDialog = ref(false)

const handleConfirmDelete = (confirmed: boolean) => {
  if (!confirmed || !classIdToDelete.value) {
    classIdToDelete.value = undefined
    return
  }
  executeDelte(classIdToDelete.value)
}

const executeDelte = async (classId: string) => {
  try {
    await backend.deleteClass(classId)
    await studentStore.populateClasses()
    classIdToDelete.value = undefined
    alert('تم حذف القسم بنجاح')
  } catch (error) {
alert('حدث خطأ أثناء حذف القسم')
  }
}
const executeEdit = (classId: string) => {

}
</script>
<style scoped></style>