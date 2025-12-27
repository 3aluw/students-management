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
                    <Button label="إبطاء" icon="pi pi-clock" iconPos="right" severity="secondary" class="mx-2"
                        @click="createEvent('lateness', selectedStudents.map(student => student.id))"
                        :disabled="!selectedStudents || !selectedStudents.length" />
                    <Button label="غياب" icon="pi pi-ban" iconPos="right" severity="secondary" class="mx-2"
                        @click="createEvent('absence', selectedStudents.map(student => student.id))"
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
                <Column header="القسم" v-if="globalSearchInput.length">
                    <template #body="slotProps: DataTableSlot<Student>">
                        <p>{{studentStore.classOptions.find((classObj) => classObj.value ===
                            slotProps.data.class_id)?.label}}</p>
                    </template>
                </Column>
                <Column header="">
                    <template #body="slotProps: DataTableSlot<Student>">
                        <div class="flex gap-2">
                            <Button @click="createEvent('lateness', [slotProps.data.id])" icon="pi pi-clock"
                                severity="warn" rounded outlined />
                            <Button @click="createEvent('absence', [slotProps.data.id])" icon="pi pi-ban"
                                severity="danger" rounded outlined />
                        </div>


                    </template>
                </Column>
                <template #empty>
                    <p class="text-center bold"> لا يوجد أي طلبة</p>
                </template>
            </DataTable>
        </div>
        <Dialog header="إعدادت" v-model:visible="showSettingsDialog" :style="{ width: '350px' }" :modal="true">
            <PlaygroundSettingsForm :settings="playgroundSettings" @submit="applyNewSettings" />
        </Dialog>

        <Dialog :header="eventDialogHeader" v-model:visible="showEventDialog" :style="{ width: '350px' }" :modal="true">
            <UtilsEventForm :eventType="selectedEventType" :entity-object="createDefaultEventData(selectedEventType)"
                @submit="handleEventSubmit" />
        </Dialog>

    </div>
</template>
<script setup lang="ts">
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import type { Student, DataTableSlot, PlaygroundSettings, EventTypes, AbsenceInfo, LatenessInfo, NewLateness, NewAbsence } from '~/data/types'
import { userFeedbackMessages } from '~/data/static';
import { useStudentStore } from '~/store/studentStore';
const { minutesAfterMidnight } = useDataUtils();
const studentStore = useStudentStore();
const backend = useBackend()
const toast = useToast();
const { absence: absenceToastMessages, lateness: latenessToastMessages } = userFeedbackMessages
type EventInfo<T extends EventTypes> = T extends 'absence' ? AbsenceInfo : LatenessInfo
type NewEvent<T extends EventTypes> = T extends 'absence' ? NewAbsence : NewLateness
const showEventDialog = ref(false);
const eventDialogHeader = computed(() => `أدخل معلومات ${selectedEventType.value === 'lateness' ? 'التأخر' : 'الغياب'}`)
const selectedEventType = ref<EventTypes>('lateness');
const lastEventValues = ref<Pick<EventInfo<'absence'> | EventInfo<'lateness'>, 'reason' | 'reason_accepted'>>({
    reason: '',
    reason_accepted: 0
})
const createEvent = <T extends EventTypes>(eventType: T, ids: number[], data?: EventInfo<T>) => {
    //check if data is absent and fast mode is on => create event with defaults
    if (playgroundSettings.value.fastMode) {
        data = createDefaultEventData(eventType)
        postEvent(eventType, ids, data)
    }
    //if the fast mode is off => open dialog to fill data
    else {
        selectedEventType.value = eventType
        showEventDialog.value = true
        selectedStudentsIds.value = ids
    }
}
const handleEventSubmit = <T extends EventTypes>(data: EventInfo<T>) => {
    const eventType = selectedEventType.value as T
    postEvent(eventType, selectedStudentsIds.value, data)
    lastEventValues.value = {
        reason: data.reason,
        reason_accepted: data.reason_accepted
    }
    showEventDialog.value = false
}
const postEvent = async<T extends EventTypes>(eventType: T, ids: number[], data: EventInfo<T>) => {
    const rowsToInsert = bindStudentIdToEventInfo(eventType, ids, data);
    console.log('rowsToInsert: ', rowsToInsert);
    let toastMessage = '';
    let severity: 'success' | 'error' = 'success';
    let skippedIds: number[] = []
    let insertedCount = 0;
    try {
        if (eventType === 'absence') {
            const result = await backend.insertAbsences(rowsToInsert);
            skippedIds = result.skippedIds;
            insertedCount = result.insertedCount;
            toastMessage = absenceToastMessages.addSuccess;
        } else if (eventType === 'lateness') {
            const result = await backend.insertLateness(rowsToInsert as NewLateness[]);
            skippedIds = result.skippedIds;
            insertedCount = result.insertedCount;
            toastMessage = latenessToastMessages.addSuccess;
        }
    } catch (error) {
        severity = 'error';
        toastMessage =
            eventType === 'absence'
                ? absenceToastMessages.addFailed
                : latenessToastMessages.addFailed;
        console.error(error);
    } finally {
        if (severity === 'error') {
            toast.add({ severity, summary: toastMessage, life: 3000 });
        } else if (skippedIds.length === 0) {
            resetSelectedStudents();
            toast.add({ severity, summary: toastMessage, life: 3000 });
        } else {
            createPartialAddToastMessage(eventType, insertedCount, skippedIds);
            resetSelectedStudents();
        }

    }
}
const createPartialAddToastMessage = (eventType: EventTypes, insertedCount: number, skippedIds: number[]) => {
    if (insertedCount) {
        const summary = eventType === 'absence' ? absenceToastMessages.partialAddSuccess : latenessToastMessages.partialAddSuccess
        toast.add({ severity: 'success', summary: `${summary} ${insertedCount}`, life: 3000 });
    }
    const summary = eventType === 'absence' ? absenceToastMessages.partialAddFailed : latenessToastMessages.partialAddFailed
    const studentNames = skippedIds.map((id) => {
        const student = selectedStudents.value.find((student) => student.id === id);
        const className = studentStore.classOptions.find((classObj) => classObj.value ===
            student?.class_id)?.label
        return student ? `${student.first_name} ${student.last_name} من قسم :   ${className}` : undefined;

    }).join('\n');
    toast.add({ severity: 'error', summary: `${summary}`, detail: studentNames });
}

const bindStudentIdToEventInfo = <T extends EventTypes>(eventType: T, ids: number[], data: EventInfo<T>): NewEvent<T>[] => {
    if (eventType === 'absence') {
        const absencesToInsert = ids.map((student_id) => ({
            student_id,
            date: data.date,
            start_time : data.start_time,
            reason: data.reason,
            reason_accepted: data.reason_accepted
        }))
        return absencesToInsert as NewEvent<T>[];
    }
    else {
        const latenessToInsert = ids.map((student_id) => ({
            student_id,
            date: data.date,
            reason: data.reason,
            reason_accepted: data.reason_accepted,
            late_by: (data as LatenessInfo).late_by,
            start_time: (data as LatenessInfo).start_time
        }))
        return latenessToInsert as NewEvent<T>[];
    }
}

const createDefaultEventData = <T extends EventTypes>(eventType: T): EventInfo<T> => {
    const { fastMode, defaultReason, reasonAcceptedByDefault, dynamicTime, defaultStartTime, defaultLateBy } = playgroundSettings.value
    let base = {
        date: new Date().setMinutes(0, 0, 0),
        start_time: defaultStartTime,
        reason: !fastMode && lastEventValues.value.reason?.length ? lastEventValues.value.reason : defaultReason,
        reason_accepted: !fastMode && lastEventValues.value.reason?.length ? lastEventValues.value.reason_accepted : reasonAcceptedByDefault
    } as EventInfo<T>
    if (eventType === 'lateness') {
        base = {
            ...base,         
            late_by: dynamicTime ? minutesAfterMidnight(new Date()) - defaultStartTime : defaultLateBy
        }
    }
    return base as EventInfo<T>
}
//table logic
const dt = ref(); //dataTable Ref
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const studentsToShow = computed(() => globalSearchInput.value.trim().length ? studentStore.searchedStudents : studentStore.students)
const changeClass = (classId: number) => {
    studentStore.populateStudents(classId)
}
const playgroundSettings = ref<PlaygroundSettings>({
    defaultStartTime: 480,
    dynamicTime: false,
    defaultLateBy: 10,
    fastMode: false,
    defaultReason: 'غير محدد',
    reasonAcceptedByDefault: 0
})
const applyNewSettings = (newSettings: PlaygroundSettings) => {
    playgroundSettings.value = newSettings
    showSettingsDialog.value = false
    toast.add({ severity: 'success', summary: 'تم تطبيق الإعدادات الجديدة بنجاح', life: 3000 })
}
// global search logic
const globalSearchInput = ref('')
watchDebounced(globalSearchInput, () => {
    studentStore.populateSearchedStudents(globalSearchInput.value)
}, { debounce: 500, maxWait: 2000 },)

//selected students dialog logic
const displaySelectedStudentsDialog = ref(false);


// select students logic
const selectedStudents = ref<Student[]>([])
const selectedStudentsIds = ref<number[]>([])
const deleteFromSelectedStudents = (studentId: number) => {
    selectedStudents.value = selectedStudents.value.filter((student) => student.id !== studentId)
}
const resetSelectedStudents = () => { selectedStudents.value = [] }
// playground settings
const showSettingsDialog = ref(false);


</script>