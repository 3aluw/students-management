<template>
  <div class="card">
    <div class="font-semibold text-xl mb-4">الأقسام
      <Button class="mx-4" icon="pi pi-plus" severity="contrast" text raised rounded @click="showClassDialog = true" />
    </div>
    <DataTable :value="studentStore.classes" scrollable scrollHeight="400px" stripedRows class="mt-6">
      <Column field="grade" header="المستوى" style="min-width: 200px" class="font-bold">
      </Column>
      <Column header="الطور" style="min-width: 200px">
        <template #body="{ data }: DataTableSlot<Class>">
          <p>{{ ArabicSchoolLevels[data.school_level] }}</p>
        </template>
      </Column>
      <Column field="section" header="الحرف" style="min-width: 200px"> </Column>
      <Column header="تعديل" style="min-width: 50px">
        <template #body="slotProps">
          <Button @click="handleEditClick(slotProps.data)" icon="pi pi-pencil" severity="secondary" rounded />
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
    <Dialog header="أدخل معلومات القسم" @hide="classToEdit = undefined" v-model:visible="showClassDialog"
      :style="{ width: '350px' }" :modal="true">
      <UtilsNewEntityForm entityType="class" :entityObject="classToEdit" @submit="handleSubmit" />
    </Dialog>

  </div>

</template>
<script setup lang="ts">

import type { Class, NewClass,DataTableSlot } from '~/data/types'
import { useStudentStore } from '~/store/studentStore';
import { ArabicSchoolLevels } from '~/data/static';

const studentStore = useStudentStore()
const backend = useBackend()
const toast = useToast();

const showClassDialog = ref(false)
const classToEdit = ref<Class | undefined>(undefined)
const classIdToDelete = ref<number | undefined>(undefined)

const handleEditClick = (classObj: Class) => {
  classToEdit.value = classObj;
  showClassDialog.value = true;
}
const handleDeleteClick = (classObj: Class) => {
  classIdToDelete.value = classObj.id
  showConfirmDialog.value = true
}
const showConfirmDialog = ref(false)

const handleConfirmDelete = (confirmed: boolean) => {
  if (!confirmed || !classIdToDelete.value) {
    classIdToDelete.value = undefined
    return
  }
  executeDelete(classIdToDelete.value)
}

const executeDelete = async (classId: number) => {
  try {
    await backend.deleteClass(classId)
    await studentStore.populateClasses()
    classIdToDelete.value = undefined
    toast.add({ severity: 'success', summary: 'تم حذف القسم بنجاح', life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'حدث خطأ أثناء حذف القسم', life: 3000 })

  }
}
const handleSubmit = (newClass: NewClass) => {
  classToEdit.value ? EditClass({ ...newClass, id: classToEdit.value.id }) : createNewClass(newClass)
}

const EditClass = async (classObj: Class) => {
  try {
    await backend.updateClass(classObj)
    await studentStore.populateClasses()
    showClassDialog.value = false
    toast.add({ severity: 'success', summary: 'تم تعديل القسم بنجاح', life: 3000 })

  } catch (error) {
    toast.add({ severity: 'error', summary: 'حدث خطأ أثناء تعديل معلومات القسم', life: 3000 })

  }
}
const createNewClass = async (newClass: NewClass) => {
  try {
    await backend.createClass(newClass)
    await studentStore.populateClasses()
    showClassDialog.value = false
    toast.add({ severity: 'success', summary: 'تم إنشاء القسم بنجاح', life: 3000 })

  } catch (error) {
    toast.add({ severity: 'error', summary: 'حدث خطأ أثناء إنشاء القسم', life: 3000 })

  }
}
</script>
<style scoped></style>