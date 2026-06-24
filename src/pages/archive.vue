<template>
    <div>
        <UtilsStudentsTable :global-search-active="false" :settings="{
            clearSelectionOnClassChange: true, columnsToHide: ['class']
        }" :students="studentsToShow" :table-search-value="''" v-model="selectedStudents">
            <template #toolbar>
                <Toolbar class="mb-6">
                    <template #start>
                        <Button :disabled="selectedStudents.length == 0" label="حذف" icon="pi pi-trash" iconPos="right"
                            severity="secondary" class="mx-2" @click="useDeleteConfirm.requestAction(selectedStudents)" />
                        <Button :disabled="selectedStudents.length == 0" label="نقل إلى" icon="pi pi-undo"
                            @click="toggleTransferStudentsMenu" aria-haspopup="true" aria-controls="overlay_menu"
                            iconPos="right" severity="secondary" class="mx-2" />
                        <Menu ref="transferStudentsMenu" id="overlay_menu" :model="studentStore.classOptions"
                            :popup="true">
                            <template #item="{ item }">
                                <Button variant="text" severity="secondary"
                                    @click="useTransferConfirm.requestAction(selectedStudents, [item.value])"> {{
                                        item.label
                                    }}</Button>
                            </template>
                        </Menu>
                    </template>
                </Toolbar>
            </template>
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <div class="flex gap-4">
                        <h4 class="m-0">{{ 'الطلبة المغادرون' }}</h4>

                        <SelectButton name="status" :options="statusFilterOptions" optionLabel="label"
                            optionValue="value" v-model="modalFilters.status" :allow-empty="false" />

                        <DatePicker :showButtonBar="true" :manualInput="false" placeholder="سنة المغادرة"
                            v-model="modalFilters.exited_at_Year" view="year" dateFormat="yy">
                        </DatePicker>


                    </div>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="modalFilters.name" placeholder="بحث عن ..." />
                    </IconField>
                </div>
            </template>
        </UtilsStudentsTable>
    </div>

    <UtilsConfirmDialog header="استرجاع الطلبة"
        message="هل أنت متأكد من رغبتك في  استرجاع الطلبة المحددين ونقلهم إلى القسم ؟" :danger="true"
        v-model="useTransferConfirm.showConfirm.value" @confirm="useTransferConfirm.confirmAction" />

    <UtilsConfirmDialog header="حذف نهائي " message="هل أنت متأكد من رغبتك حذف الطلبة المحددين نهائيا  ؟"
        :danger="true" v-model="useDeleteConfirm.showConfirm.value" @confirm="useDeleteConfirm.confirmAction" />
</template>

<script setup lang="ts">
import { watchDebounced } from '@vueuse/core';

import {
    statusFilterOptions,
    userFeedbackMessages
} from '~/models/static';

import type {
    BatchEditStudent,
    InactiveStudentQueryFilters,
    Student
} from '~/models/types';

import { useStudentStore } from '~/store/studentStore';

/* -------------------------------------------------------------------------- */
/*                                Stores                                      */
/* -------------------------------------------------------------------------- */

const studentStore = useStudentStore();

const backend = useBackend();


/* -------------------------------------------------------------------------- */
/*                                Messages                                    */
/* -------------------------------------------------------------------------- */

const { student: toastMessages } = userFeedbackMessages;

/* -------------------------------------------------------------------------- */
/*                                Types                                       */
/* -------------------------------------------------------------------------- */

type ClientFilters = {
    name: string;
    status: 'graduated' | 'dropped' | 'transferred';
    exited_at_Year: Date | undefined;
};

/* -------------------------------------------------------------------------- */
/*                                State                                       */
/* -------------------------------------------------------------------------- */

const studentsToShow = ref<Student[]>([]);
const selectedStudents = ref<Student[]>([]); //passed from the table component


const modalFilters = ref<ClientFilters>({
    status: 'graduated',
    exited_at_Year: undefined,
    name: ''
});

/* -------------------------------------------------------------------------- */
/*                              Data Fetching                                 */
/* -------------------------------------------------------------------------- */

const getStudents = async (
    filters: InactiveStudentQueryFilters
) => {
    studentsToShow.value =
        await backend.getStudents(filters);
};

const formatModalFilters =
    (): InactiveStudentQueryFilters => ({
        ...modalFilters.value,
        exited_at_Year:
            modalFilters.value.exited_at_Year?.getTime()
    });

onMounted(() => {
    getStudents({
        status: 'graduated'
    });
});

watchDebounced(
    modalFilters.value,
    () => {
        getStudents(formatModalFilters());
    },
    { debounce: 500 }
);

/* -------------------------------------------------------------------------- */
/*                              Shared Actions                                */
/* -------------------------------------------------------------------------- */
/* runs after Transfer or Delete actions */
const afterAction = () => {
    getStudents(formatModalFilters());
    selectedStudents.value = [];
};

/* -------------------------------------------------------------------------- */
/*                            Transfer Students                               */
/* -------------------------------------------------------------------------- */

const transferStudentsMenu = ref();

const toggleTransferStudentsMenu = (
    event: Event
) => {
    transferStudentsMenu.value.toggle(event);
};

const transferStudents = async (
    students: Student[],
    classId: number
) => {
    const studentIds = students.map(
        (student) => student.id
    );

    const reqBody: BatchEditStudent = {
        class_id: classId,
        status: 'active',
        exited_at: null,
        ids: studentIds
    };

    await backend.updateStudents(reqBody);
};

const useTransferConfirm = useConfirmHandler(
    transferStudents,
    afterAction,
    toastMessages.transferSuccess,
    toastMessages.transferFailed
);

/* -------------------------------------------------------------------------- */
/*                              Delete Students                               */
/* -------------------------------------------------------------------------- */

const deleteStudents = async (
    students: Student[]
) => {
    const studentIds = students.map(
        (student) => student.id
    );

    await backend.deleteStudents(studentIds);
};

const useDeleteConfirm = useConfirmHandler(
    deleteStudents,
    afterAction,
    toastMessages.deleteSuccess,
    toastMessages.deleteFailed
);

</script>