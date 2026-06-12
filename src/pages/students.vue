<template>
    <div>
        <UtilsStudentsTable :global-search-active="globalSearchInput.length > 0" :settings="{
            clearSelectionOnClassChange: true
        }" :students="studentsToShow" :table-search-value="tableSearchValue" v-model="selectedStudents">
            <template #toolbar>
                <Toolbar class="mb-6">
                    <template #start>
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
                        <Button label="جديد" icon="pi pi-plus" iconPos="right" severity="secondary" class="mx-2"
                            @click="showStudentDialog = true" />
                        <Button v-if="selectedStudents.length" label="حذف" icon="pi pi-trash" iconPos="right"
                            severity="secondary" class="mx-2" @click="showStudentDeleteDialog = true" />
                        <Button label="تعديل" icon="pi pi-pencil" iconPos="right" severity="secondary" class="mx-2"
                            @click="handleStudentEditClick" v-if="selectedStudents.length == 1" />
                        <Button v-if="selectedStudents.length" label="نقل إلى" icon="pi pi-undo"
                            @click="toggleTransferStudentsMenu" aria-haspopup="true" aria-controls="overlay_menu"
                            iconPos="right" severity="secondary" class="mx-2" />
                        <Menu ref="transferStudentsMenu" id="overlay_menu" :model="filteredClassOptions" :popup="true">
                            <template #item="{ item }">
                                <Button variant="text" severity="secondary"
                                    @click="useTransferConfirm.requestAction(selectedStudents, [item.value])"> {{
                                        item.label
                                    }}</Button>
                            </template>
                        </Menu>

                    </template>

                    <template #end>
                        <Button label="تحميل" icon="pi pi-download" iconPos="right" severity="secondary"
                            @click="exportCSV()" />
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
                        <InputText v-model="tableSearchValue" placeholder="بحث في القسم المحدد" />
                    </IconField>

                </div>
            </template>
        </UtilsStudentsTable>

        <Dialog header="أدخل معلومات القسم" @hide="studentToEdit = undefined" v-model:visible="showStudentDialog"
            :style="{ width: '350px' }" :modal="true">
            <UtilsEntityForm entityType="student" :entityObject="studentToEdit" @submit="handleStudentSubmit" />
        </Dialog>

        <Dialog header="حذف التلاميذ المحددين من القسم" v-model:visible="showStudentDeleteDialog"
            :style="{ width: '350px' }" :modal="true">
            <studentDeleteForm @delete="deleteStudents(selectedStudents)"
                @change-status="payload => handleStudentQuit(payload, selectedStudents)" />
        </Dialog>

        <UtilsConfirmDialog header="تحويل الطلبة" message="هل أنت متأكد من رغبتك في  التحويل إلى قسم آخر ؟"
            :danger="false" v-model="useTransferConfirm.showConfirm.value"
            @confirm="useTransferConfirm.confirmAction" />
    </div>
</template>
<script setup lang="ts">
/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */
import { useToast } from 'primevue/usetoast';

import type {
    Student,
    NewStudent,
    BatchEditStudent,
    EditStudent,
    InactiveStudent
} from '~/data/types';

import { userFeedbackMessages } from '~/data/static';
import { useStudentStore } from '~/store/studentStore';


/* -------------------------------------------------------------------------- */
/*                                Composables                                 */
/* -------------------------------------------------------------------------- */

const backend = useBackend();
const toast = useToast();
const studentStore = useStudentStore();

const { student: toastMessages } = userFeedbackMessages;


/* -------------------------------------------------------------------------- */
/*                               Table Logic                                  */
/* -------------------------------------------------------------------------- */

const dt = ref();

const tableSearchValue = ref('')
const studentsToShow = computed(() =>
    globalSearchInput.value.trim().length
        ? studentStore.searchedStudents
        : studentStore.students
);

function exportCSV() {
    dt.value.exportCSV();
}


/* -------------------------------------------------------------------------- */
/*                              Class change Handling                         */
/* -------------------------------------------------------------------------- */

const changeClass = (classId: number) => {
    selectedStudents.value = [];
    studentStore.populateStudents(classId);
};


/* -------------------------------------------------------------------------- */
/*                              Global Search                                 */
/* -------------------------------------------------------------------------- */

const globalSearchInput = ref('');

watchDebounced(
    globalSearchInput,
    () => {
        studentStore.populateSearchedStudents(globalSearchInput.value);
    },
    {
        debounce: 500,
        maxWait: 2000
    }
);


/* -------------------------------------------------------------------------- */
/*                           Student Selection                                */
/* -------------------------------------------------------------------------- */

const selectedStudents = ref<Student[]>([]);

const resetSelectedStudents = () => {
    selectedStudents.value = [];
};


/* -------------------------------------------------------------------------- */
/*                           Transfer Students                                */
/* -------------------------------------------------------------------------- */
// A tempalte ref for the transfer students menu 
const transferStudentsMenu = ref();
const showStudentDeleteDialog = ref(false);
const toggleTransferStudentsMenu = (event: Event) => {
    transferStudentsMenu.value.toggle(event);
};

const filteredClassOptions = computed(() =>
    studentStore.classOptions.filter(
        (classObject) =>
            classObject.value !== studentStore.selectedClassId
    )
);
//used inside confirm composable so there is no catching of errors here
const transferStudents = async (
    students: Student[],
    classId: number
) => {
    const studentIds = students.map(
        (student) => student.id
    );

    const reqBody: BatchEditStudent = {
        class_id: classId,
        ids: studentIds
    };
    await backend.updateStudents(reqBody);



};
const afterStdentTransfer = async () => {
    resetSelectedStudents();
    studentStore.populateStudents;
}
const useTransferConfirm = useConfirmHandler(
    transferStudents,
    afterStdentTransfer
);

/* -------------------------------------------------------------------------- */
/*                          Create / Edit Student                             */
/* -------------------------------------------------------------------------- */

const showStudentDialog = ref(false);

const studentToEdit = ref<Student>();

const handleStudentEditClick = () => {
    if (selectedStudents.value.length !== 1) return;

    studentToEdit.value = studentsToShow.value.find(
        (student) =>
            student.id === selectedStudents.value[0]!.id
    );

    showStudentDialog.value = true;
};

const EditStudent = async (studentObj: Student) => {
    try {
        await backend.updateStudents(studentObj);

        await studentStore.populateStudents(
            studentToEdit.value?.class_id!
        );
        resetSelectedStudents();
        showStudentDialog.value = false;

        toast.add({
            severity: 'success',
            summary: toastMessages.updateSuccess,
            life: 3000
        });

    } catch (error) {
        toast.add(
            getToastErrorObject(
                error,
                toastMessages.updateFailed
            )
        );
    }
};

const createNewStudent = async (
    newStudent: NewStudent
) => {
    try {
        await backend.createStudent(newStudent);

        await studentStore.populateStudents(
            newStudent.class_id
        );

        showStudentDialog.value = false;

        toast.add({
            severity: 'success',
            summary: toastMessages.addSuccess,
            life: 3000
        });

    } catch (error) {
        toast.add(
            getToastErrorObject(
                error,
                toastMessages.addFailed
            )
        );
    }
};

const handleStudentSubmit = (
    newStudent: NewStudent
) => {
    studentToEdit.value
        ? EditStudent({
            ...newStudent,
            id: studentToEdit.value.id
        })
        : createNewStudent(newStudent);
};


/* -------------------------------------------------------------------------- */
/*                              Delete Students                               */
/* -------------------------------------------------------------------------- */

const deleteStudents = async (students: Student[]) => {

    const studentIds = students.map(
        (student) => student.id
    );
    try {
        await backend.deleteStudents(studentIds);
        studentStore.populateStudents();
        toast.add({
            severity: 'success',
            summary: toastMessages.deleteSuccess,
            life: 3000
        });
        resetSelectedStudents();
        showStudentDeleteDialog.value = false;
    }
    catch (error) {
        toast.add(
            getToastErrorObject(
                error,
                toastMessages.deleteFailed
            )
        );
    }

};

const handleStudentQuit = (newStatus: Pick<InactiveStudent, "status" | "exited_at">, students: Student[]) => {
    const pyload: BatchEditStudent = {
        ...newStatus,
        class_id: null,
        ids: students.map((s) => s.id),
    }
    try {
        backend.updateStudents(pyload);
        studentStore.populateStudents();
        toast.add({
            severity: 'success',
            summary: toastMessages.deleteSuccess,
            life: 3000
        });
        resetSelectedStudents();
        showStudentDeleteDialog.value = false;
    } catch (error) {
        toast.add(
            getToastErrorObject(
                error,
                toastMessages.deleteFailed
            )
        );
    }

}



</script>
