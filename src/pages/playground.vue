<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="إعدادت" icon="pi pi-cog" iconPos="right" severity="secondary" class="mx-2"
                        @click="showSettingsDialog = true" />
                </template>
                <template #end>
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
                    <Button label="إبطاء" icon="pi pi-clock" iconPos="right" severity="secondary" class="mx-2" @click=""
                        :disabled="!selectedStudents || !selectedStudents.length" />
                    <Button label="غياب" icon="pi pi-ban" iconPos="right" severity="secondary" class="mx-2" @click=""
                        :disabled="!selectedStudents || !selectedStudents.length" />

                </template>
                <template #end>
                    <Button label="طلبة تم تحديدهم" icon="pi pi-check" iconPos="right" severity="secondary"
                        @click="displaySelectedStudentsDialog = true" :badge="selectedStudents.length.toString()" />
                    <Dialog header="Dialog" v-model:visible="displaySelectedStudentsDialog"
                        :breakpoints="{ '960px': '75vw' }" :style="{ width: '40vw' }" :modal="true">
                        <DataView :value="selectedStudents" dataKey="id">
                            <template #list="slotProps">
                                <div class="flex flex-col">
                                    <div v-for="(student, index) in slotProps.items" :key="index"
                                        class="flex flex-row justify-between items-center p-1 border-b">
                                        <p class="w-40">{{ student.first_name + ' ' + student.last_name }}</p>
                                        <p>{{
                                            studentStore.classOptions.find((classObj) => classObj.value ===
                                                student.class_id)?.label}}</p>
                                        <Button @click="deleteFromSelectedStudents(student.id)" icon="pi pi-times"
                                            severity="danger" variant="text" rounded aria-label="delete" />
                                    </div>
                                </div>
                            </template>
                        </DataView>
                        <template #footer>
                            <Button label="إغلاق" @click="displaySelectedStudentsDialog = false" />
                        </template>
                    </Dialog>
                </template>
            </Toolbar>
            {{ selectedStudents }}

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
                        <p>{{studentStore.classOptions.find((classObj) => classObj.value ===
                            slotProps.data.class_id)?.label}}</p>
                    </template>
                </Column>
                <template #empty>
                    <p class="text-center bold"> لا يوجد أي طلبة</p>
                </template>
            </DataTable>
        </div>
        <Dialog header="إعدادت"  v-model:visible="showSettingsDialog"
            :style="{ width: '350px' }" :modal="true">
            <PlaygroundSettingsForm  :settings="PlaygroundSettings"/>
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
import type { Student, DataTableSlot, PlaygroundSettings, BatchEditStudent } from '~/data/types'
import { userFeedbackMessages, ArabicBooleans } from '~/data/static';
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
const PlaygroundSettings = ref<PlaygroundSettings>({
    defaultStartTime: 480,
    dynamicTime : false,
    defaultLateBy : 10,
    fastMode : false,
    defaultReason : 'غير محدد',
})
// global search logic
const globalSearchInput = ref('')
watchDebounced(globalSearchInput, () => {
    studentStore.populateSearchedStudents(globalSearchInput.value)
}, { debounce: 500, maxWait: 2000 },)

//selected students dialog logic
const displaySelectedStudentsDialog = ref(false);

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
const deleteFromSelectedStudents = (studentId: number) => {
    selectedStudents.value = selectedStudents.value.filter((student) => student.id !== studentId)
}
const resetSelectedStudents = () => { selectedStudents.value = [] }

// edit / create student logic
const showSettingsDialog = ref(false);



const deleteStudents = async (students: Student[]) => {
    const studentIds = students.map((student) => student.id)
    await backend.deleteStudents(studentIds);
    resetSelectedStudents()

}



//confirm dialogs
const useDeleteConfirm = useConfirmHandler(() => deleteStudents(selectedStudents.value), studentStore.populateStudents)
const useTransferConfirm = useConfirmHandler(transferStudents, studentStore.populateStudents)


function exportCSV() {
    dt.value.exportCSV();
}

</script>