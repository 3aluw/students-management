<template>
    <div>
        <div class="card">
            <!-- Toolbar above the table - action buttons -->
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="حذف" icon="pi pi-trash" iconPos="right" severity="secondary" class="mx-2"
                        @click="useDeleteConfirm.requestAction(selectedLateness)"
                        :disabled="!selectedLateness || !selectedLateness.length" />
                    <Button label="تعديل" icon="pi pi-pencil" iconPos="right" severity="secondary" class="mx-2"
                        @click="handleEditClick" :disabled="!selectedLateness || !selectedLateness.length" />
                </template>

                <template #end>
                    <Button label="تحميل" icon="pi pi-download" iconPos="right" severity="secondary"
                        @click="exportCSV()" />
                </template>
            </Toolbar>
            <DataTable :ref="dt" v-model:selection="selectedLateness" :value="eventStore.lateness" dataKey="id"
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
        <Dialog header="أدخل معلومات التأخر" @hide="latenessToEdit = undefined" v-model:visible="showLatenessDialog"
            :style="{ width: '350px' }" :modal="true">
            <UtilsEventForm eventType="lateness" :entityObject="latenessToEdit" @submit="handleLatenessSubmit" />
        </Dialog>
        <UtilsConfirmDialog header="حذف الغياب" :danger="true" v-model="useDeleteConfirm.showConfirm.value"
            @confirm="useDeleteConfirm.confirmAction" />
    </div>
</template>
<script setup lang="ts">

import { useToast } from 'primevue/usetoast';
import type { DataTableSlot, EventQueryFilters, SupportedDateRanges, LocalLateness, EditLateness, BatchEditLateness, LatenessInfo } from '~/data/types'
import { userFeedbackMessages } from '~/data/static';
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
    eventStore.populateLateness(dbFilters.value)
}

// ========== LIFECYCLE HOOKS ==========
onMounted(async () => {
    totalRecords.value = await eventStore.populateLateness(dbFilters.value)
})

// ========== REACTIVE REFERENCES ==========
// Dialog states
const showLatenessDialog = ref(false)
const latenessToEdit = ref<LatenessInfo | undefined>(undefined)

// Data table references
const dt = ref(); //dataTable Ref
const totalRecords = ref(0)
const selectedLateness = ref<LocalLateness[]>([]);
const dbFilters = ref<EventQueryFilters>({
    limit: 20,
    offset: 0,
})

// ========== EVENT HANDLERS ==========

// Lateness management handlers
const handleLatenessSubmit = async (latenessInfo: LatenessInfo) => {
    let lateness: BatchEditLateness | EditLateness;

    if (selectedLateness.value.length === 1) {
        lateness = { id: selectedLateness.value[0].id, ...latenessInfo }
    }
    else {
        const ids = selectedLateness.value.map((lateness) => lateness.id)
        lateness = { ...latenessInfo, ids }
    }
    editLateness(lateness)
}

const handleEditClick = () => {
    const lateness = selectedLateness.value[0] // pass the first selected lateness
    latenessToEdit.value = {
        date: lateness.date,
        reason: lateness.reason,
        reason_accepted: lateness.reason_accepted,
        late_by: lateness.late_by,
        start_time: lateness.start_time,
    }
    showLatenessDialog.value = true
}
//selection handlers
const resetSelected = () => { selectedLateness.value = [] }

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
        showLatenessDialog.value = false
        latenessToEdit.value = undefined
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
    resetSelected()
}

// ========== CONFIRMATION DIALOG ==========
const useDeleteConfirm = useConfirmHandler(() => deleteLateness(selectedLateness.value), () => eventStore.populateLateness(dbFilters.value), toastMessages.deleteSuccess, toastMessages.deleteFailed)

// ========== UTILITY FUNCTIONS ==========
function exportCSV() {
    dt.value.exportCSV();
}

</script>