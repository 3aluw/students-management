<template>
    <div>


            <slot name="toolbar">
                <!-- Toolbar button goes here -->
            </slot>

            <DataTable :ref="dt" v-model:selection="selectedStudents" :value="studentsToShow" dataKey="id"
                :paginator="true" :rows="10" :filters="filters" stripedRows
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="يتم عرض من {first} إلى {last} من مجموع الطلبة: {totalRecords}"
                :globalFilterFields="['first_name', 'last_name']">
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <div class="flex gap-4">
                            <h4 class="m-0">{{ props.settings.tableTitle || 'قائمة الطلبة' }}</h4>
                            <Select name="class_id" :options="studentStore.classOptions" optionLabel="label"
                                optionValue="value" placeholder="اختر الصف" @update:modelValue="changeClass"
                                v-model="studentStore.selectedClassId" v-show="!props.globalSearchValue.length" />
                        </div>
                        <IconField v-show="!props.globalSearchValue.length">
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
                <Column v-if="!props.settings.columnsToHide?.includes('phone_number')" field="phone_number" header="رقم الهاتف" style="min-width: 5rem"></Column>
                <Column v-if="!props.settings.columnsToHide?.includes('address')"field="address" header="العنوان" style="min-width: 16rem"></Column>
                <Column v-if="!props.settings.columnsToHide?.includes('class')" header="القسم" v-show="props.globalSearchValue.length">
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
</template>
<script setup lang="ts">
import { FilterMatchMode } from '@primevue/core/api';
import type { Student, DataTableSlot, } from '~/data/types'
import { useStudentStore } from '~/store/studentStore';
const studentStore = useStudentStore();

// ========== TABLE SETTINGS PASSED FROM PARENT ==========
type tableSettings = {
    clearSelectionOnClassChange: boolean
    tableTitle?: string
    columnsToHide?: ('phone_number' | 'address' | 'class')[]
}
const props = defineProps<{
    settings: tableSettings
    globalSearchValue: string
}>()

// ========== selectedStudents MODEL SHARED TO PARENT ==========
const selectedStudents = defineModel<Student[]> ()

// ========== TABLE REFERENCES & SEARCH FUNCTIONALITY==========
const dt = ref(); //dataTable Ref
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// ========== TABLE DATA  ==========
// SHOW STUDENTS BASED ON GLOBAL SEARCH 
const studentsToShow = computed(() => props.globalSearchValue.trim().length ? studentStore.searchedStudents : studentStore.students)

// CHANGE CLASS HANDLING
const changeClass = (classId: number) => {
    if (props.settings.clearSelectionOnClassChange) selectedStudents.value = []
    studentStore.populateStudents(classId)
}
// global search logic
watchDebounced(() => props.globalSearchValue, () => {
    studentStore.populateSearchedStudents(props.globalSearchValue)
}, { debounce: 500, maxWait: 2000 },)


// reset selected students
const resetSelectedStudents = () => { selectedStudents.value = [] }

</script>