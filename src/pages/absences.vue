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

            <DataTable :ref="dt" v-model:selection="selectedAbsences" :value="eventStore.absences" dataKey="id"
                :paginator="true" :rows="10" stripedRows lazy @page="updatePage" :totalRecords="totalRecords"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="يتم عرض من {first} إلى {last} من مجموع الغيابات: {totalRecords}"
                :globalFilterFields="['first_name', 'last_name']">

                <template #header>

                    <div class="flex flex-wrap gap-2 items-center justify-around">
                        <h4 class="m-0">آخر الغيابات </h4>

                        <div class="flex flex-wrap gap-4 items-center justify-between">
                            <div class="flex gap-4">
                                <Select name="class_id" :options="classOptions" optionLabel="label" optionValue="value"
                                    placeholder="اختر الصف" v-model="dbFilters.classId"
                                    v-show="!globalSearchInput.length" />
                            </div>
                            <div class="flex flex-col gap-2">
                                <SelectButton name="date range" :options="dateFilterOptions" optionLabel="label"
                                    optionValue="value" v-model="selectedDateRange"
                                    @update:modelValue="updateDateRangeSelect" />
                                <DatePicker v-model="dateRange" showIcon fluid iconDisplay="input"
                                    selection-mode="range" @value-change="(e) => updateDateRange(e, 'date picker')" />

                            </div>
                            <IconField>
                                <InputIcon>
                                    <i class="pi pi-search" />
                                </InputIcon>
                                <InputText v-model="dbFilters.name" placeholder="بحث عن..." />

                            </IconField>
                        </div>

                        <Button icon="pi pi-times" severity="secondary" variant="text" rounded aria-label="Cancel"
                            @click="resetFilters" />
                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="first_name" header="الاسم" class="hidden" />
                <Column field="last_name" header="اللقب" class="hidden" />
                <Column header="الاسم واللقب" sortable class="font-bold">
                    <template #body="slotProps: DataTableSlot<LocalAbsence>">
                        <p>{{ slotProps.data.last_name + " " + slotProps.data.first_name }}</p>
                    </template>
                </Column>

                <Column field="date" header="التاريخ" style="min-width: 5rem">
                    <template #body="slotProps: DataTableSlot<LocalAbsence>">
                        <p>{{ useDateFormat(slotProps.data.date, 'YYYY-MM-DD (ddd)', { locales: 'ar-SA' }) }}</p>
                    </template>
                </Column>
                <Column field="reason" header="العنوان" style="min-width: 16rem"></Column>
                <Column field="reason_accepted" header="عذر مقبول" style="min-width: 16rem">
                    <template #body="slotProps: DataTableSlot<LocalAbsence>">
                        <p>{{ slotProps.data.reason_accepted ? 'نعم' : 'لا' }}</p>
                    </template>
                </Column>
                <Column header="القسم">
                    <template #body="slotProps: DataTableSlot<LocalAbsence>">
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
            <UtilsEventForm eventType="absence" :entityObject="absenceToEdit" @submit="handleAbsenceSubmit" />
        </Dialog>
        <UtilsConfirmDialog header="حذف الغياب" :danger="true" v-model="useDeleteConfirm.showConfirm.value"
            @confirm="useDeleteConfirm.confirmAction" />
    </div>
</template>
<script setup lang="ts">
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import type { Student, DataTableSlot, NewStudent, LocalAbsence, EventQueryFilters, SupportedDateRanges, AbsenceInfo, NewAbsence, EditAbsence, BatchEditAbsence } from '~/data/types'
import { userFeedbackMessages, dateFilterOptions } from '~/data/static';
import { useStudentStore } from '~/store/studentStore';
import { useEventStore } from '~/store/eventStore';
import type { DataTablePageEvent } from 'primevue';
const studentStore = useStudentStore();
const eventStore = useEventStore()
const { normalizeResultBooleans, getTimeRange } = useFormUtils()
const backend = useBackend()
const toast = useToast();
const { absence: toastMessages } = userFeedbackMessages

onMounted(async () => {
    totalRecords.value = await eventStore.populateAbsences(dbFilters.value)
})

const showAbsenceDialog = ref(false)
const absenceToEdit = ref<AbsenceInfo | undefined>(undefined)
const totalRecords = ref(0)

const handleAbsenceSubmit = async (absenceInfo: AbsenceInfo) => {
    let absences: BatchEditAbsence | EditAbsence;

    if (selectedAbsences.value.length === 1) {
        absences = { id: selectedAbsences.value[0].id, ...absenceInfo }
    }
    else {
        const ids = selectedAbsences.value.map((absence) => absence.id)
        absences = { ...absenceInfo, ids }
    }
    EditAbsences(absences)
}
const EditAbsences = async (absences: BatchEditAbsence | EditAbsence) => {
    try {
        await backend.updateAbsences(absences)
        toast.add({ severity: 'success', summary: toastMessages.updateSuccess, life: 3000 });
        showAbsenceDialog.value = false
        absenceToEdit.value = undefined
        resetSelected()
    }
    catch (error) {
        toast.add({ severity: 'error', summary: toastMessages.updateFailed, life: 3000 });
        return
    }
    await eventStore.populateAbsences(dbFilters.value)

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
const dbFilters = ref<EventQueryFilters>({
    limit: 20,
    offset: 0,
})
const classOptions = computed(() => {
    return [{ label: 'كل الأقسام', value: undefined }, ...studentStore.classOptions]
})
watch(dbFilters.value, () => {
    eventStore.populateAbsences(dbFilters.value)
})

const updatePage = (event: DataTablePageEvent) => {
    const { page, rows } = event
    dbFilters.value.offset = page * rows
    dbFilters.value.limit = rows
}
const resetFilters = () => {
    dateRange.value = undefined
    selectedDateRange.value = undefined
    const dbFiltersKeys = Object.keys(dbFilters.value) as (keyof EventQueryFilters)[]
    dbFiltersKeys.forEach((key) => {
        if (key !== 'limit' && key !== 'offset') {
            dbFilters.value[key] = undefined
        }
    })
    dbFilters.value = {
        limit: dbFilters.value.limit,
        offset: dbFilters.value.offset,
    }

}
//table logic
const dt = ref(); //dataTable Ref
const selectedDateRange = ref<SupportedDateRanges | undefined>(undefined) //used By date ranges select buttons
const dateRange = ref<Date[] | undefined>(undefined) //used By datePicker

const updateDateRangeSelect = (value: SupportedDateRanges | null) => {
    if (value === null) {
        dateRange.value = undefined
        return
    }
    const [min, max] = getTimeRange(value)
    dateRange.value = [new Date(min), new Date(max)]
    updateDateRange(dateRange.value, "select buttons")

}

const updateDateRange = (value: Date | Date[] | (Date | null)[] | null | undefined, changeSource: "select buttons" | "date picker" = 'date picker') => {
    if (!Array.isArray(value) || value.length !== 2) return
    if (value[0] === null || value[1] === null) {
        dateRange.value = undefined
        dbFilters.value.minDate = undefined
        dbFilters.value.maxDate = undefined
        return
    }
    dbFilters.value.minDate = value[0].getTime()
    dbFilters.value.maxDate = value[1].getTime()
    if (changeSource === "date picker") {
        selectedDateRange.value = undefined
    }
}
// global search logic
const globalSearchInput = ref('')
watchDebounced(globalSearchInput, () => {
    studentStore.populateSearchedStudents(globalSearchInput.value)
}, { debounce: 500, maxWait: 2000 },)


// select absences logic
const selectedAbsences = ref<LocalAbsence[]>([])
const resetSelected = () => { selectedAbsences.value = [] }


const deleteAbsences = async (absences: LocalAbsence[]) => {
    const studentIds = absences.map((absence) => absence.id)
    await backend.deleteAbsences(studentIds);
    resetSelected()
}



//confirm dialogs
const useDeleteConfirm = useConfirmHandler(() => deleteAbsences(selectedAbsences.value), () => eventStore.populateAbsences(dbFilters.value),toastMessages.deleteSuccess, toastMessages.deleteFailed)

function exportCSV() {
    dt.value.exportCSV();
}

</script>