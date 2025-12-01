<template>
    <div>
        <div class="card">
            <!-- Toolbar above the table - action buttons -->
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="حذف" icon="pi pi-trash" iconPos="right" severity="secondary" class="mx-2"
                        @click="useDeleteConfirm.requestAction(selectedAbsences)"
                        :disabled="!selectedAbsences || !selectedAbsences.length" />
                    <Button label="تعديل" icon="pi pi-pencil" iconPos="right" severity="secondary" class="mx-2"
                        @click="handleEditClick" :disabled="!selectedAbsences || !selectedAbsences.length" />
                </template>

                <template #end>
                    <Button label="تحميل" icon="pi pi-download" iconPos="right" severity="secondary"
                        @click="exportCSV()" />
                </template>
            </Toolbar>
            <DataTable :ref="dt" v-model:selection="selectedAbsences" :value="eventStore.lateness" dataKey="id"
                :paginator="true" :rows="10" stripedRows lazy @page="updatePage" :totalRecords="totalRecords"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="يتم عرض من {first} إلى {last} من مجموع التأخرات: {totalRecords}">

                <template #header>
                    <UtilsFilterPanel title="آخر التاخرات" :filters="['classId', 'name', 'dateRange']"
                        @updateFilters="updateFilters" />
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column header="الاسم واللقب" sortable class="font-bold">
                    <template #body="slotProps: DataTableSlot<LocalLateness>">
                        <p>{{ slotProps.data.last_name + " " + slotProps.data.first_name }}</p>
                    </template>
                </Column>

                <Column field="date" header="التاريخ" style="min-width: 5rem">
                    <template #body="slotProps: DataTableSlot<LocalLateness>">
                        <p>{{ useDateFormat(slotProps.data.date, 'YYYY-MM-DD (ddd)', { locales: 'ar-SA' }) }}</p>
                    </template>
                </Column>
                <Column field="late_by" header="متأخر ب(min)" style="min-width: 2rem"></Column>
                <Column field="reason" header="السبب" style="min-width: 2rem"></Column>
                <Column field="reason_accepted" header="عذر مقبول" style="min-width: 16rem">
                    <template #body="slotProps: DataTableSlot<LocalLateness>">
                        <p>{{ slotProps.data.reason_accepted ? 'نعم' : 'لا' }}</p>
                    </template>
                </Column>
                <Column header="القسم">
                    <template #body="slotProps: DataTableSlot<LocalLateness>">
                        <p>{{studentStore.classOptions.find((classObj) => classObj.value ===
                            slotProps.data.class_id)?.label}}</p>
                    </template>
                </Column>
                <template #empty>
                    <p class="text-center bold"> لا يوجد أي طلبة</p>
                </template>
            </DataTable>
        </div>
        <Dialog header="أدخل معلومات القسم" @hide="absenceToEdit = undefined" v-model:visible="showAbsenceDialog"
            :style="{ width: '350px' }" :modal="true">
            <UtilsEventForm eventType="absence" :entityObject="absenceToEdit" @submit="handleLatenessSubmit" />
        </Dialog>
        <UtilsConfirmDialog header="حذف الغياب" :danger="true" v-model="useDeleteConfirm.showConfirm.value"
            @confirm="useDeleteConfirm.confirmAction" />
    </div>
</template>
<script setup lang="ts">

import { useToast } from 'primevue/usetoast';
import type { DataTableSlot, EventQueryFilters, SupportedDateRanges, AbsenceInfo, EditAbsence, BatchEditAbsence, LocalLateness, EditLateness, BatchEditLateness } from '~/data/types'
import { userFeedbackMessages, dateFilterOptions } from '~/data/static';
import { useStudentStore } from '~/store/studentStore';
import { useEventStore } from '~/store/eventStore';
import type { DataTablePageEvent } from 'primevue';

// ========== STORES & SERVICES ==========
const studentStore = useStudentStore();
const eventStore = useEventStore()
const backend = useBackend()
const toast = useToast();
// ========== TOAST & MESSAGES ==========
const { lateness: toastMessages } = userFeedbackMessages


const updateFilters = (filtersObj: EventQueryFilters) => {
    const { limit, offset } = dbFilters.value
    dbFilters.value = { limit, offset, ...filtersObj }
    console.log(dbFilters.value);
    eventStore.populateLateness(dbFilters.value)
}

// ========== LIFECYCLE HOOKS ==========
onMounted(async () => {
    totalRecords.value = await eventStore.populateLateness(dbFilters.value)
})

// ========== REACTIVE REFERENCES ==========
// Dialog states
const showAbsenceDialog = ref(false)
const absenceToEdit = ref<AbsenceInfo | undefined>(undefined)

// Data table references
const dt = ref(); //dataTable Ref
const totalRecords = ref(0)
const selectedAbsences = ref<LocalLateness[]>([]);
const dbFilters = ref<EventQueryFilters>({
    limit: 20,
    offset: 0,
})

// ========== EVENT HANDLERS ==========

// Absence management handlers
const handleLatenessSubmit = async (absenceInfo: AbsenceInfo) => {
    let lateness: BatchEditLateness | EditLateness;

    if (selectedAbsences.value.length === 1) {
        lateness = { id: selectedAbsences.value[0].id, ...absenceInfo }
    }
    else {
        const ids = selectedAbsences.value.map((absence) => absence.id)
        lateness = { ...absenceInfo, ids }
    }
    editLateness(lateness)
}

const handleEditClick = () => {
    showAbsenceDialog.value = true
    const absence = selectedAbsences.value[0] // pass the first selected absence
    absenceToEdit.value = {
        date: absence.date,
        reason: absence.reason,
        reason_accepted: absence.reason_accepted,
    }

}
//selection handlers
const resetSelected = () => { selectedAbsences.value = [] }

// Data table handlers
const updatePage = (event: DataTablePageEvent) => {
    const { page, rows } = event
    dbFilters.value.offset = page * rows
    dbFilters.value.limit = rows
    eventStore.populateLateness(dbFilters.value)
}



// ========== BUSINESS LOGIC ==========

const editLateness = async (lateness: BatchEditLateness | EditLateness) => {
    try {
        await backend.updateLateness(lateness)
        toast.add({ severity: 'success', summary: toastMessages.updateSuccess, life: 3000 });
        showAbsenceDialog.value = false
        absenceToEdit.value = undefined
        resetSelected()
    }
    catch (error) {
        toast.add({ severity: 'error', summary: toastMessages.updateFailed, life: 3000 });
        return
    }
    await eventStore.populateLateness(dbFilters.value)

}

const deleteLateness = async (lateness: LocalLateness[]) => {
    const studentIds = lateness.map((lateness) => lateness.id)
    await backend.deleteLateness(studentIds);
    eventStore.populateLateness(dbFilters.value)
    resetSelected()
}

// ========== CONFIRMATION DIALOG ==========
const useDeleteConfirm = useConfirmHandler(() => deleteLateness(selectedAbsences.value), () => eventStore.populateAbsences(dbFilters.value), toastMessages.deleteSuccess, toastMessages.deleteFailed)

// ========== UTILITY FUNCTIONS ==========
function exportCSV() {
    dt.value.exportCSV();
}

</script>