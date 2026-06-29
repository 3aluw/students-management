<template>
  <div>
    <div class="card">
      <!-- Toolbar above the table - action buttons -->
      <Toolbar class="mb-6">
        <template #start>
          <Button label="حذف" icon="pi pi-trash" iconPos="right" severity="secondary" class="mx-2"
            @click="useDeleteConfirm.requestAction(selectedInfractions)"
            :disabled="!selectedInfractions || !selectedInfractions.length" />
          <Button label="تعديل" icon="pi pi-pencil" iconPos="right" severity="secondary" class="mx-2"
            @click="handleEditClick" :disabled="!selectedInfractions || !selectedInfractions.length" />
        </template>

        <template #end>
          <ExcelImportExport @handleExport="handleExport" />
        </template>
      </Toolbar>
      <DataTable ref="dt" v-model:selection="selectedInfractions" :value="eventStore.infractions" dataKey="id"
        :paginator="true" :rows="10" stripedRows lazy @page="updatePage" :totalRecords="totalRecords"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="يتم عرض من {first} إلى {last} من مجموع المخالفات: {totalRecords}">

        <template #header>
          <UtilsFilterPanel title="آخر المخالفات" :filters="['classId', 'name', 'dateRange']"
            @updateFilters="updateFilters" />
        </template>

        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column header="الاسم واللقب" sortable class="font-bold">
          <template #body="slotProps: DataTableSlot<LocalInfraction>">
            <p>{{ slotProps.data.last_name + " " + slotProps.data.first_name }}</p>
          </template>
        </Column>

        <Column field="date" header="التاريخ" style="min-width: 5rem">
          <template #body="slotProps: DataTableSlot<LocalInfraction>">
            <p>{{ useDateFormat(slotProps.data.date, 'YYYY-MM-DD (ddd)', { locales: 'ar-SA' }) }}</p>
          </template>
        </Column>
        <Column field="reason" header="السبب" style="min-width: 2rem"></Column>
        <Column field="subject" header="المادة"> </Column>
        <Column header="القسم">
          <template #body="slotProps: DataTableSlot<LocalInfraction>">
            <p>{{studentStore.classOptions.find((classObj) => classObj.value ===
              slotProps.data.class_id)?.label}}</p>
          </template>
        </Column>
        <template #empty>
          <p class="text-center bold"> لا يوجد أي طلبة</p>
        </template>
      </DataTable>
    </div>
    <Dialog header="أدخل معلومات المخالفة" @hide="infractionToEdit = undefined" v-model:visible="showInfractionDialog"
      :style="{ width: '350px' }" :modal="true">
      <UtilsEventForm eventType="infraction" :entityObject="infractionToEdit!" @submit="handleInfractionSubmit" />
    </Dialog>
    <UtilsConfirmDialog header="حذف الغياب" :danger="true" v-model="useDeleteConfirm.showConfirm.value"
      @confirm="useDeleteConfirm.confirmAction" />
  </div>
</template>
<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import type {
  EventQueryFilters,
  LocalInfraction,
  DataTableSlot,
  InfractionInfo,
  BatchEditInfraction,
  EditInfraction,
} from '~/models/types';

import { userFeedbackMessages, ArabicXLSXInfractionProperties } from '~/models/static';
import { useStudentStore } from '~/store/studentStore';
import { useEventStore } from '~/store/eventStore';
import { formatEventsForExcelExport, exportXlsx } from "~/service/excel"
import { getClassName } from "~/service/entity"

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

const { infraction: toastMessages } = userFeedbackMessages;

/* -------------------------------------------------------------------------- */
/*                                State                                       */
/* -------------------------------------------------------------------------- */

// Dialog
const showInfractionDialog = ref(false);
const infractionToEdit = ref<InfractionInfo>();

// Table
const dt = ref();
const totalRecords = ref(0);

const selectedInfractions = ref<LocalInfraction[]>([]);

const dbFilters = ref<EventQueryFilters>({
  limit: 10,
  offset: 0
});

/* -------------------------------------------------------------------------- */
/*                              Lifecycle                                     */
/* -------------------------------------------------------------------------- */

onMounted(async () => {
  totalRecords.value = await eventStore.populateInfractions(
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

  eventStore.populateInfractions(dbFilters.value);
};

/* -------------------------------------------------------------------------- */
/*                              Selection                                     */
/* -------------------------------------------------------------------------- */

const resetSelected = () => {
  selectedInfractions.value = [];
};



/* -------------------------------------------------------------------------- */
/*                              Pagination                                    */
/* -------------------------------------------------------------------------- */

const updatePage = (event: DataTablePageEvent) => {
  const { page, rows } = event;

  dbFilters.value.offset = page * rows;
  dbFilters.value.limit = rows;

  eventStore.populateInfractions(dbFilters.value);
};

/* -------------------------------------------------------------------------- */
/*                            Infraction Click Actions                                */
/* -------------------------------------------------------------------------- */

const handleEditClick = () => {
  const infraction = selectedInfractions.value[0];

  if (!infraction) return;

  infractionToEdit.value = {
    date: infraction.date,
    reason: infraction.reason,
    subject: infraction.subject,
    minutes_after_start: infraction.minutes_after_start,
    start_time: infraction.start_time
  };

  showInfractionDialog.value = true;
};

const handleInfractionSubmit = async (
  InfractionInfo: InfractionInfo
) => {
  const payload: BatchEditInfraction | EditInfraction =
    selectedInfractions.value.length === 1
      ? {
        id: selectedInfractions.value[0]!.id,
        ...InfractionInfo
      }
      : {
        ...InfractionInfo,
        ids: selectedInfractions.value.map((l) => l.id)
      };

  editInfraction(payload);
};

/* -------------------------------------------------------------------------- */
/*                                API Logic                                   */
/* -------------------------------------------------------------------------- */

const editInfraction = async (
  infraction: BatchEditInfraction | EditInfraction
) => {
  try {
    await backend.updateInfractions(infraction);

    toast.add({
      severity: 'success',
      summary: toastMessages.updateSuccess,
      life: 3000
    });

    showInfractionDialog.value = false;
    infractionToEdit.value = undefined;

    resetSelected();

    await eventStore.populateInfractions(dbFilters.value);

  } catch (error) {
    toast.add(
      getToastErrorObject(error, toastMessages.updateFailed)
    );
  }
};

const deleteInfractions = async (
  infraction: LocalInfraction[]
) => {
  const ids = infraction.map((l) => l.id);

  await backend.deleteInfractions(ids);

  resetSelected();
};

/* -------------------------------------------------------------------------- */
/*                              Confirm Handler                               */
/* -------------------------------------------------------------------------- */

const useDeleteConfirm = useConfirmHandler(
  () => deleteInfractions(selectedInfractions.value),
  () => eventStore.populateInfractions(dbFilters.value),
  toastMessages.deleteSuccess,
  toastMessages.deleteFailed
);

/* -------------------------------------------------------------------------- */
/*                               Excel Export Logic                           */
/* -------------------------------------------------------------------------- */
const handleExport = async () => {
  const { limit, offset, ...userFilters } = dbFilters.value
  const infractions = (await backend.getInfractions(userFilters)).infractions
  const selectedClassId = dbFilters.value?.classId
  const classOptions = studentStore.classOptions
  const className = selectedClassId ? getClassName(classOptions, selectedClassId) ?? "قائمة المخالفات" : "قائمة المخالفات"
  const structuredData = formatEventsForExcelExport(infractions, ArabicXLSXInfractionProperties, classOptions)
  exportXlsx(structuredData, className)
}
</script>