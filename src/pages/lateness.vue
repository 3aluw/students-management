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
          <Button label="تحميل" icon="pi pi-download" iconPos="right" severity="secondary" @click="handleExportClick" />
        </template>
      </Toolbar>
      <DataTable ref="dt" v-model:selection="selectedLateness" :value="eventStore.lateness" dataKey="id"
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
      <UtilsEventForm eventType="lateness" :entityObject="latenessToEdit!" @submit="handleLatenessSubmit" />
    </Dialog>
    <UtilsConfirmDialog header="حذف الغياب" :danger="true" v-model="useDeleteConfirm.showConfirm.value"
      @confirm="useDeleteConfirm.confirmAction" />
  </div>
</template>
<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import type {
  EventQueryFilters,
  LocalLateness,
  EditLateness,
  BatchEditLateness,
  LatenessInfo,
  DataTableSlot,
} from '~/data/types';

import { userFeedbackMessages, ArabicXLSXLatenessProperties } from '~/data/static';
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

const { lateness: toastMessages } = userFeedbackMessages;

/* -------------------------------------------------------------------------- */
/*                                State                                       */
/* -------------------------------------------------------------------------- */

// Dialog
const showLatenessDialog = ref(false);
const latenessToEdit = ref<LatenessInfo>();

// Table
const dt = ref();
const totalRecords = ref(0);

const selectedLateness = ref<LocalLateness[]>([]);

const dbFilters = ref<EventQueryFilters>({
  limit: 10,
  offset: 0
});

/* -------------------------------------------------------------------------- */
/*                              Lifecycle                                     */
/* -------------------------------------------------------------------------- */

onMounted(async () => {
  totalRecords.value = await eventStore.populateLateness(
    dbFilters.value
  );
});

/* -------------------------------------------------------------------------- */
/*                                Filters                                     */
/* -------------------------------------------------------------------------- */

const updateFilters = (filtersObj: EventQueryFilters) => {
  const { limit, offset } = dbFilters.value;

  dbFilters.value = {
    limit,
    offset,
    ...filtersObj
  };

  eventStore.populateLateness(dbFilters.value);
};

/* -------------------------------------------------------------------------- */
/*                              Selection                                     */
/* -------------------------------------------------------------------------- */

const resetSelected = () => {
  selectedLateness.value = [];
};

/* -------------------------------------------------------------------------- */
/*                               Excel features Logic                         */
/* -------------------------------------------------------------------------- */


const handleExportClick = async () => {
  const {limit, offset, ...userFilters} =  dbFilters.value
  const lateness = (await backend.getLateness(userFilters)).lateness
  const selectedClassId = dbFilters.value?.classId
  const classOptions = studentStore.classOptions
  const className = selectedClassId ? getClassName(classOptions, selectedClassId) ?? "قائمة التأخرات" : "قائمة التأخرات"
  const structuredData = getFormattedEventJson(lateness, ArabicXLSXLatenessProperties, classOptions)
  exportXlsx(structuredData, className)
}
/* -------------------------------------------------------------------------- */
/*                              Pagination                                    */
/* -------------------------------------------------------------------------- */

const updatePage = (event: DataTablePageEvent) => {
  const { page, rows } = event;

  dbFilters.value.offset = page * rows;
  dbFilters.value.limit = rows;

  eventStore.populateLateness(dbFilters.value);
};

/* -------------------------------------------------------------------------- */
/*                            Lateness Click Actions                                */
/* -------------------------------------------------------------------------- */

const handleEditClick = () => {
  const lateness = selectedLateness.value[0];

  if (!lateness) return;

  latenessToEdit.value = {
    date: lateness.date,
    reason: lateness.reason,
    reason_accepted: lateness.reason_accepted,
    late_by: lateness.late_by,
    start_time: lateness.start_time
  };

  showLatenessDialog.value = true;
};

const handleLatenessSubmit = async (
  latenessInfo: LatenessInfo
) => {
  const payload: BatchEditLateness | EditLateness =
    selectedLateness.value.length === 1
      ? {
        id: selectedLateness.value[0]!.id,
        ...latenessInfo
      }
      : {
        ...latenessInfo,
        ids: selectedLateness.value.map((l) => l.id)
      };

  editLateness(payload);
};

/* -------------------------------------------------------------------------- */
/*                                API Logic                                   */
/* -------------------------------------------------------------------------- */

const editLateness = async (
  lateness: BatchEditLateness | EditLateness
) => {
  try {
    await backend.updateLateness(lateness);

    toast.add({
      severity: 'success',
      summary: toastMessages.updateSuccess,
      life: 3000
    });

    showLatenessDialog.value = false;
    latenessToEdit.value = undefined;

    resetSelected();

    await eventStore.populateLateness(dbFilters.value);

  } catch (error) {
    toast.add(
      getToastErrorObject(error, toastMessages.updateFailed)
    );
  }
};

const deleteLateness = async (
  lateness: LocalLateness[]
) => {
  const ids = lateness.map((l) => l.id);

  await backend.deleteLateness(ids);

  resetSelected();
};

/* -------------------------------------------------------------------------- */
/*                              Confirm Handler                               */
/* -------------------------------------------------------------------------- */

const useDeleteConfirm = useConfirmHandler(
  () => deleteLateness(selectedLateness.value),
  () => eventStore.populateLateness(dbFilters.value),
  toastMessages.deleteSuccess,
  toastMessages.deleteFailed
);

/* -------------------------------------------------------------------------- */
/*                                Export                                      */
/* -------------------------------------------------------------------------- */

function exportCSV() {
  dt.value.exportCSV();
}
</script>