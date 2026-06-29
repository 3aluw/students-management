<template>
    <div>
        <UtilsStudentsTable :global-search-active="globalSearchInput.length > 0" :settings="{
            clearSelectionOnClassChange: true
        }" :students="studentsToShow" :table-search-value="tableSearchValue" v-model="selectedStudents">
            <template #toolbar>
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
                        <Button label="مخالفة" icon="pi pi-ban" iconPos="right" severity="secondary" class="mx-2"
                            @click="createEvent('infraction', selectedStudents.map(student => student.id))"
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
            </template>

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
                        <InputText v-model="tableSearchValue" placeholder="بحث عن..." />
                    </IconField>

                </div>
            </template>

            <template #customColumn="{ slotProps }">
                <div class="flex gap-2">
                    <Button @click="createEvent('lateness', [slotProps.data.id])" icon="pi pi-clock" severity="warn"
                        rounded outlined />
                    <Button @click="createEvent('absence', [slotProps.data.id])" icon="pi pi-ban" severity="danger"
                        rounded outlined />
                </div>
            </template>
        </UtilsStudentsTable>

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
import { useToast } from 'primevue/usetoast';

import type {
    Student,
    PlaygroundSettings,
    EventTypes,
    AbsenceInfo,
    LatenessInfo,
    NewLateness,
    NewAbsence,
    NewInfraction,
    InfractionInfo,
} from '~/models/types';

import { eventTypesArabicDict, userFeedbackMessages } from '~/models/static';
import { useStudentStore } from '~/store/studentStore';

/* -------------------------------------------------------------------------- */
/*                                Stores                                      */
/* -------------------------------------------------------------------------- */

const studentStore = useStudentStore();
const backend = useBackend();
const toast = useToast();

/* -------------------------------------------------------------------------- */
/*                              Messages                                      */
/* -------------------------------------------------------------------------- */

const {
    absence: absenceToastMessages,
    lateness: latenessToastMessages,
    infraction: infractionToastMessages
} = userFeedbackMessages;

/* -------------------------------------------------------------------------- */
/*                              Types helpers                                 */
/* -------------------------------------------------------------------------- */

type EventInfo<T extends EventTypes> = T extends 'absence' ? AbsenceInfo : T extends 'lateness' ? LatenessInfo : InfractionInfo


type NewEvent<T extends EventTypes> =
    T extends 'absence' ? NewAbsence : T extends 'lateness' ? NewLateness : NewInfraction;

/* -------------------------------------------------------------------------- */
/*                              Settings                                      */
/* -------------------------------------------------------------------------- */

const playgroundSettings = ref<PlaygroundSettings>({
    defaultStartTime: 480,
    dynamicTime: false,
    defaultLateBy: 10,
    fastMode: false,
    defaultReason: 'غير محدد',
    reasonAcceptedByDefault: 0
});

const applyNewSettings = (newSettings: PlaygroundSettings) => {
    playgroundSettings.value = newSettings;
    showSettingsDialog.value = false;

    toast.add({
        severity: 'success',
        summary: 'تم تطبيق الإعدادات الجديدة بنجاح',
        life: 3000
    });
};

/* -------------------------------------------------------------------------- */
/*                              UI State                                      */
/* -------------------------------------------------------------------------- */


const tableSearchValue = ref('')
const globalSearchInput = ref('');
const selectedStudents = ref<Student[]>([]);
const selectedStudentsIds = ref<number[]>([]);

const showSettingsDialog = ref(false);
const displaySelectedStudentsDialog = ref(false);

/* -------------------------------------------------------------------------- */
/*                              Event Dialog                                  */
/* -------------------------------------------------------------------------- */

const showEventDialog = ref(false);
const selectedEventType = ref<EventTypes>('lateness');

const eventTypeInArabic = computed(() => eventTypesArabicDict[selectedEventType.value])

const eventDialogHeader = computed(() =>
    `أدخل معلومات ${eventTypeInArabic.value}`
);

const lastEventValues = ref<Pick<
    AbsenceInfo | LatenessInfo,
    'reason' | 'reason_accepted'
>>({
    reason: '',
    reason_accepted: 0
});

/* -------------------------------------------------------------------------- */
/*                              Students                                      */
/* -------------------------------------------------------------------------- */

const studentsToShow = computed(() =>
    globalSearchInput.value.trim().length
        ? studentStore.searchedStudents
        : studentStore.students
);

const changeClass = (classId: number) => {
    studentStore.populateStudents(classId);
};

const deleteFromSelectedStudents = (studentId: number) => {
    selectedStudents.value = selectedStudents.value.filter(
        (s) => s.id !== studentId
    );
};

const resetSelectedStudents = () => {
    selectedStudents.value = [];
};

/* -------------------------------------------------------------------------- */
/*                              Search                                        */
/* -------------------------------------------------------------------------- */

watchDebounced(
    globalSearchInput,
    () => {
        studentStore.populateSearchedStudents(globalSearchInput.value);
    },
    { debounce: 500, maxWait: 2000 }
);

/* -------------------------------------------------------------------------- */
/*                              Event Flow                                    */
/* -------------------------------------------------------------------------- */

const createEvent = <T extends EventTypes>(
    eventType: T,
    ids: number[]
) => {
    //check if fast mode is on => create event with defaults
    if (playgroundSettings.value.fastMode) {
        const data = createDefaultEventData(eventType);
        postEvent(eventType, ids, data);
        return;
    }
    //if the fast mode is off => open dialog to fill data
    selectedEventType.value = eventType;
    selectedStudentsIds.value = ids;
    showEventDialog.value = true;
};

const handleEventSubmit = <T extends EventTypes>(
    data: EventInfo<T>
) => {
    const eventType = selectedEventType.value as T;

    postEvent(eventType, selectedStudentsIds.value, data);

    lastEventValues.value.reason = data.reason
    if ('reason_accepted' in data) {
        lastEventValues.value.reason_accepted = data.reason_accepted
    }

    showEventDialog.value = false;
};

/* -------------------------------------------------------------------------- */
/*                              Core API                                      */
/* -------------------------------------------------------------------------- */

const postEvent = async <T extends EventTypes>(
    eventType: T,
    ids: number[],
    data: EventInfo<T>
) => {
    const rows = bindStudentIdToEventInfo(eventType, ids, data);
    let severity: 'success' | 'error' = 'success';
    let message = '';
    try {
        if (eventType === 'absence') {
            await backend.insertAbsences(rows as NewAbsence[]);
            message = absenceToastMessages.addSuccess;
        } else if (eventType == 'lateness') {
            await backend.insertLateness(rows as NewLateness[]);
            message = latenessToastMessages.addSuccess;
        }
        else {
            await backend.insertInfractions(rows as NewInfraction[])
            message = infractionToastMessages.addSuccess
        }
        resetSelectedStudents();
        toast.add({ severity: 'success', summary: message, life: 3000 });
    } catch (error) {
        severity = 'error';

        const errMsg =
            eventType === 'absence'
                ? absenceToastMessages.addFailed
                : eventType === 'lateness' ? latenessToastMessages.addFailed : infractionToastMessages.addFailed;

        toast.add(getToastErrorObject(error, errMsg));
    }
};

/* -------------------------------------------------------------------------- */
/*                              Helpers                                       */
/* -------------------------------------------------------------------------- */

const bindStudentIdToEventInfo = <T extends EventTypes>(
    eventType: T,
    ids: number[],
    data: EventInfo<T>
): NewEvent<T>[] => {
    if (eventType === 'absence') {
        return ids.map((student_id) => ({
            student_id,
            date: data.date,
            start_time: data.start_time,
            reason: data.reason,
            reason_accepted: (data as AbsenceInfo).reason_accepted
        })) as NewEvent<T>[];
    }
    else if (eventType === 'lateness') {
        return ids.map((student_id) => ({
            student_id,
            date: data.date,
            reason: data.reason,
            reason_accepted: (data as LatenessInfo).reason_accepted,
            start_time: (data as LatenessInfo).start_time,
            late_by: (data as LatenessInfo).late_by,
        })) as NewEvent<T>[];
    };
    return ids.map((student_id) => ({
        student_id,
        date: data.date,
        reason: data.reason,
        subject: (data as InfractionInfo).subject,
        start_time: (data as LatenessInfo).start_time,
        minutes_after_start: (data as InfractionInfo).minutes_after_start,

    })) as NewEvent<T>[];
}

const createDefaultEventData = <T extends EventTypes>(
    eventType: T
): EventInfo<T> => {
    const {
        fastMode,
        defaultReason,
        reasonAcceptedByDefault,
        dynamicTime,
        defaultStartTime,
        defaultLateBy
    } = playgroundSettings.value;

    const base = {
        date: new Date().setMinutes(0, 0, 0),
        start_time: defaultStartTime,
        reason:
            !fastMode && lastEventValues.value.reason
                ? lastEventValues.value.reason
                : defaultReason,
    } as EventInfo<T>;

    const reason_accepted = !fastMode && lastEventValues.value.reason
        ? lastEventValues.value.reason_accepted
        : reasonAcceptedByDefault

    const minutesOffset = dynamicTime
        ? minutesAfterMidnight(new Date()) - defaultStartTime
        : defaultLateBy

    if (eventType === 'lateness') {
        return {
            ...base,
            reason_accepted,
            late_by: minutesOffset
        } as EventInfo<T>;
    }
    else if (eventType == "absence") {
        return {
            ...base,
            reason_accepted,
        } as EventInfo<T>;
    }
    else if (eventType === 'infraction') {
        return {
            ...base,
            minutes_after_start: minutesOffset
        } as EventInfo<T>;
    }

    return base;
};

/* -------------------------------------------------------------------------- */
/*                              Partial Toast                                 */
/* -------------------------------------------------------------------------- */
//dropped since the backend returns the message only
const createPartialAddToastMessage = (
    eventType: EventTypes,
    insertedCount: number,
    skippedIds: number[]
) => {
    if (insertedCount) {
        const summary =
            eventType === 'absence'
                ? absenceToastMessages.partialAddSuccess
                : latenessToastMessages.partialAddSuccess;

        toast.add({
            severity: 'success',
            summary: `${summary} ${insertedCount}`,
            life: 3000
        });
    }

    const summary =
        eventType === 'absence'
            ? absenceToastMessages.partialAddFailed
            : latenessToastMessages.partialAddFailed;

    const detail = skippedIds
        .map((id) => {
            const student = selectedStudents.value.find(
                (s) => s.id === id
            );

            const className = studentStore.classOptions.find(
                (c) => c.value === student?.class_id
            )?.label;

            return student
                ? `${student.first_name} ${student.last_name} من قسم : ${className}`
                : undefined;
        })
        .join('\n');

    toast.add({
        severity: 'error',
        summary,
        detail
    });
};
</script>