<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model.trim="globalSearchInput" placeholder="بحث عام" type="search" />
                    </IconField>
                </template>
            </Toolbar>

            <Toolbar class="mb-6">
                <template #start>
                    <Button label="جديد" icon="pi pi-plus" iconPos="right" severity="secondary" class="mx-2"
                        @click="showStudentDialog = true" />
                    <Button label="حذف" icon="pi pi-trash" iconPos="right" severity="secondary" class="mx-2"
                        @click="useDeleteConfirm.requestAction(selectedStudents)"
                        :disabled="!selectedStudents || !selectedStudents.length" />
                    <Button label="تعديل" icon="pi pi-pencil" iconPos="right" severity="secondary" class="mx-2"
                        @click="" v-if="selectedStudents.length == 1" />
                    <Button v-if="selectedStudents.length" label="نقل إلى" icon="pi pi-undo" @click="toggle"
                        aria-haspopup="true" aria-controls="overlay_menu" iconPos="right" severity="secondary"
                        class="mx-2" />
                    <Menu ref="transferStudentsMenu" id="overlay_menu" :model="filteredClassOptions" :popup="true">
                        <template #item="{ item }">
                            <Button variant="text" severity="secondary"
                                @click="useTransferConfirm.requestAction(selectedStudents, item.value)"> {{ item.label
                                }}</Button>
                        </template>
                    </Menu>
                </template>

                <template #end>
                    <Button label="تحميل" icon="pi pi-download" iconPos="right" severity="secondary"
                        @click="exportCSV()" />
                </template>
            </Toolbar>
{{selectedStudents}}

            <DataTable :ref="dt" v-model:selection="selectedStudents" :value="studentsToShow" dataKey="id"
                :paginator="true" :rows="10" :filters="filters" stripedRows
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
                :globalFilterFields="['first_name', 'last_name']">
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <div class="flex gap-4">
                            <h4 class="m-0">قائمة الطلبة</h4>
                            <Select name="class_id" :options="studentStore.classOptions" optionLabel="label"
                                optionValue="value" placeholder="اختر الصف" @update:modelValue="changeClass"
                                v-model="studentStore.selectedClassId" v-show="!globalSearchInput.length" />
                        </div>
                        <IconField v-show="!globalSearchInput.length">
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="بحث عن..." />
                        </IconField>

                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>

                <Column field="first_name" header="الاسم" class="hidden" />
                <Column field="last_name" header="اللقب" class="hidden" />
                <Column header="الاسم واللقب" sortable class="font-bold">
                    <template #body="slotProps: DataTableSlot<Student>">
                        <p>{{ slotProps.data.last_name + " " + slotProps.data.first_name }}</p>
                    </template>
                </Column>
                <Column header="الأب">
                    <template #body="slotProps: DataTableSlot<Student>">
                        <p>{{ slotProps.data.father_name + " بن " + slotProps.data.grandfather_name }}</p>
                    </template>
                </Column>
                <Column field="phone_number" header="رقم الهاتف" style="min-width: 5rem"></Column>
                <Column field="address" header="العنوان" style="min-width: 16rem"></Column>
                <Column header="القسم" v-show="globalSearchInput.length">
                     <template #body="slotProps: DataTableSlot<Student>">
                        <p>{{ studentStore.classOptions.find((classObj)=>classObj.value === slotProps.data.class_id)?.label }}</p>
                    </template>
                </Column>
                <template #empty>
                    <p class="text-center bold"> لا يوجد أي طلبة</p>
                </template>
            </DataTable>
        </div>
        <Dialog header="أدخل معلومات القسم" @hide="studentToEdit = undefined" v-model:visible="showStudentDialog"
            :style="{ width: '350px' }" :modal="true">
            <UtilsEntityForm entityType="student" :entityObject="studentToEdit" @submit="handleStudentSubmit" />
        </Dialog>
        <UtilsConfirmDialog header="حذف الطلبة" :danger="true" v-model="useDeleteConfirm.showConfirm.value"
            @confirm="useDeleteConfirm.confirmAction" />
        <UtilsConfirmDialog header="تحويل الطلبة" message="هل أنت متأكد من رغبتك في  التحويل إلى قسم آخر ؟"
            :danger="false" v-model="useTransferConfirm.showConfirm.value"
            @confirm="useTransferConfirm.confirmAction" />
    </div>
</template>
<script setup lang="ts">
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import type { Student, DataTableSlot, NewStudent, BatchEditStudent } from '~/data/types'
import { userFeedbackMessages, } from '~/data/static';
import { useStudentStore } from '~/store/studentStore';
const studentStore = useStudentStore();
const backend = useBackend()
const toast = useToast();
const { student: toastMessages } = userFeedbackMessages

//table logic
const dt = ref(); //dataTable Ref
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const studentsToShow = computed(() => globalSearchInput.value.trim().length ? studentStore.searchedStudents : studentStore.students)
const changeClass = (classId: number) => {
    studentStore.populateStudents(classId)
}

// global search logic
const globalSearchInput = ref('')
watchDebounced(globalSearchInput, () => {
    studentStore.populateSearchedStudents(globalSearchInput.value)
}, { debounce: 500, maxWait: 2000 },)

//transfer student Menu logic
const transferStudentsMenu = ref(); // transfer students menu Ref
const toggle = (event: Event) => {
    transferStudentsMenu.value.toggle(event);
};
const filteredClassOptions = computed(() => studentStore.classOptions.filter((classObject) => classObject.value !== studentStore.selectedClassId))
const transferStudents = async (students: Student[], classId: number) => {
    const studentIds = students.map((student) => student.id)
    const reqBody: BatchEditStudent = { class_id: classId, ids: studentIds }
    await backend.updateStudents(reqBody)
    studentStore.populateStudents()
    resetSelectedStudents()
}

// select students logic
const selectedStudents = ref<Student[]>([])
const resetSelectedStudents = () => { selectedStudents.value = [] }

// edit / create student logic
const showStudentDialog = ref(false);
const studentToEdit = ref<Student | undefined>(undefined)
const EditStudent = async (studentObj: Student) => {
    try {
        await backend.updateStudents(studentObj)
        await studentStore.populateStudents(studentToEdit.value?.class_id!)
        showStudentDialog.value = false
        toast.add({ severity: 'success', summary: toastMessages.updateSuccess, life: 3000 })

    } catch (error) {
        toast.add({ severity: 'error', summary: toastMessages.updateFailed, life: 3000 })
    }
}
const createNewStudent = async (newStudent: NewStudent) => {
    try {
        await backend.createStudent(newStudent)
        await studentStore.populateStudents(newStudent.class_id)
        showStudentDialog.value = false
        toast.add({ severity: 'success', summary: toastMessages.addSuccess, life: 3000 })

    } catch (error) {
        toast.add({ severity: 'error', summary: toastMessages.addFailed, life: 3000 })

    }
}
const handleStudentSubmit = (newStudent: NewStudent) => {
    studentToEdit.value ? EditStudent({ ...newStudent, id: studentToEdit.value.id }) : createNewStudent(newStudent)
}


const deleteStudents = async (students: Student[]) => {
    const studentIds = students.map((student) => student.id)
    await backend.deleteStudents(studentIds);
    resetSelectedStudents()

}



//confirm dialogs
const useDeleteConfirm = useConfirmHandler(()=> deleteStudents(selectedStudents.value), studentStore.populateStudents)
const useTransferConfirm = useConfirmHandler(transferStudents, studentStore.populateStudents)


function exportCSV() {
    dt.value.exportCSV();
}

</script>