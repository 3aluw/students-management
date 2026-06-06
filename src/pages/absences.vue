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
                >

                <template #header>
                    <UtilsFilterPanel title="آخر الغيابات" :filters="['classId', 'name', 'dateRange']" @updateFilters="updateFilters"/>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
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
                <Column field="reason" header="السبب" style="min-width: 16rem"></Column>
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
        <Dialog header="أدخل معلومات الغياب" @hide="absenceToEdit = undefined" v-model:visible="showAbsenceDialog"
            :style="{ width: '350px' }" :modal="true">
            <UtilsEventForm eventType="absence" :entityObject="absenceToEdit!" @submit="handleAbsenceSubmit" />
        </Dialog>
        <UtilsConfirmDialog header="حذف الغياب" :danger="true" v-model="useDeleteConfirm.showConfirm.value"
            @confirm="useDeleteConfirm.confirmAction" />
    </div>
</template>
<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import type {
  LocalAbsence,
  EventQueryFilters,
  AbsenceInfo,
  EditAbsence,
  BatchEditAbsence,
  DataTableSlot
} from '~/data/types';

import { userFeedbackMessages } from '~/data/static';
import { useStudentStore } from '~/store/studentStore';
import { useEventStore } from '~/store/eventStore';
import type { DataTablePageEvent } from 'primevue';

/* -------------------------------------------------------------------------- */
/*                                Stores                                      */
/* -------------------------------------------------------------------------- */

const studentStore = useStudentStore();
const eventStore = useEventStore();
const backend = useBackend();
const toast = useToast();

/* -------------------------------------------------------------------------- */
/*                              Messages                                      */
/* -------------------------------------------------------------------------- */

const { absence: toastMessages } = userFeedbackMessages;

/* -------------------------------------------------------------------------- */
/*                              State                                         */
/* -------------------------------------------------------------------------- */

// Dialog
const showAbsenceDialog = ref(false);
const absenceToEdit = ref<AbsenceInfo>();

// Table
const dt = ref();
const totalRecords = ref(0);

const selectedAbsences = ref<LocalAbsence[]>([]);

const dbFilters = ref<EventQueryFilters>({
  limit: 20,
  offset: 0
});

/* -------------------------------------------------------------------------- */
/*                              Lifecycle                                     */
/* -------------------------------------------------------------------------- */

onMounted(async () => {
  totalRecords.value = await eventStore.populateAbsences(dbFilters.value);
});

/* -------------------------------------------------------------------------- */
/*                              Filters                                       */
/* -------------------------------------------------------------------------- */

const updateFilters = (filtersObj: EventQueryFilters) => {
  const { limit, offset } = dbFilters.value;

  dbFilters.value = {
    limit,
    offset,
    ...filtersObj
  };

  eventStore.populateAbsences(dbFilters.value);
};

/* -------------------------------------------------------------------------- */
/*                              Selection                                     */
/* -------------------------------------------------------------------------- */

const resetSelected = () => {
  selectedAbsences.value = [];
};

/* -------------------------------------------------------------------------- */
/*                              Table Pagination                              */
/* -------------------------------------------------------------------------- */

const updatePage = (event: DataTablePageEvent) => {
  const { page, rows } = event;

  dbFilters.value.offset = page * rows;
  dbFilters.value.limit = rows;

  eventStore.populateAbsences(dbFilters.value);
};

/* -------------------------------------------------------------------------- */
/*                              Absence Actions                               */
/* -------------------------------------------------------------------------- */

const handleEditClick = () => {
  const absence = selectedAbsences.value[0]!;

  absenceToEdit.value = {
    date: absence.date,
    start_time: absence.start_time,
    reason: absence.reason,
    reason_accepted: absence.reason_accepted
  };

  showAbsenceDialog.value = true;
};

const handleAbsenceSubmit = async (absenceInfo: AbsenceInfo) => {
  const payload: BatchEditAbsence | EditAbsence =
    selectedAbsences.value.length === 1
      ? { id: selectedAbsences.value[0]!.id, ...absenceInfo }
      : {
          ...absenceInfo,
          ids: selectedAbsences.value.map((a) => a.id)
        };

   editAbsences(payload);
};

/* -------------------------------------------------------------------------- */
/*                              API Logic                                     */
/* -------------------------------------------------------------------------- */

const editAbsences = async (
  absences: BatchEditAbsence | EditAbsence
) => {
  try {
    await backend.updateAbsences(absences);

    toast.add({
      severity: 'success',
      summary: toastMessages.updateSuccess,
      life: 3000
    });

    showAbsenceDialog.value = false;
    absenceToEdit.value = undefined;
    resetSelected();

    await eventStore.populateAbsences(dbFilters.value);
  } catch (error) {
    toast.add(getToastErrorObject(error, toastMessages.updateFailed));
  }
};

const deleteAbsences = async (absences: LocalAbsence[]) => {
  const ids = absences.map((a) => a.id);

  await backend.deleteAbsences(ids);
  resetSelected();
};

/* -------------------------------------------------------------------------- */
/*                              Confirm Handler                               */
/* -------------------------------------------------------------------------- */

const useDeleteConfirm = useConfirmHandler(
  () => deleteAbsences(selectedAbsences.value),
  () => eventStore.populateAbsences(dbFilters.value),
  toastMessages.deleteSuccess,
  toastMessages.deleteFailed
);

/* -------------------------------------------------------------------------- */
/*                              Export                                        */
/* -------------------------------------------------------------------------- */

function exportCSV() {
  dt.value.exportCSV();
}

</script>