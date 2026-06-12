<template>
    <div>
        <div class="card">
            <slot name="toolbar">
                <!-- Toolbar button goes here -->
            </slot>

            <DataTable :ref="dt" v-model:selection="selectedStudents" :value="props.students" dataKey="id"
                :paginator="true" :rows="10" :filters="filters" stripedRows
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="يتم عرض من {first} إلى {last} من مجموع الطلبة: {totalRecords}"
                :globalFilterFields="['first_name', 'last_name']">
                <template #header>
                    <slot name="header">

                    </slot>
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
                <Column v-if="!props.settings.columnsToHide?.includes('phone_number')" field="phone_number"
                    header="رقم الهاتف" style="min-width: 5rem"></Column>
                <Column v-if="!props.settings.columnsToHide?.includes('address')" field="address" header="العنوان"
                    style="min-width: 16rem"></Column>
                <Column v-if="!props.settings.columnsToHide?.includes('class')" header="القسم"
                    v-show="props.globalSearchActive">
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
    columnsToHide?: ('phone_number' | 'address' | 'class')[]
}
const props = defineProps<{
    students: Student[]
    settings: tableSettings
    tableSearchValue: string
    globalSearchActive: boolean
}>()

// ========== selectedStudents MODEL SHARED TO PARENT ==========
const selectedStudents = defineModel<Student[]>()

// ========== TABLE REFERENCES & SEARCH FUNCTIONALITY==========
const dt = ref(); //dataTable Ref
const filters = computed(() => ({
    global: {
        value: props.tableSearchValue,
        matchMode: FilterMatchMode.CONTAINS
    }
}));


// reset selected students
const resetSelectedStudents = () => { selectedStudents.value = [] }

</script>