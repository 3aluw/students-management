    <template>
        <UtilsStudentsTable :settings="{ clearSelectionOnClassChange: false, tableTitle: 'حدد الطلبة الراسبين', columnsToHide: ['address'] }" :globalSearchValue="''"
            v-model="selectedStudents">
            <template #toolbar>
                <Toolbar>
                    <template #start>
                        <Button label="طلبة تم تحديدهم" icon="pi pi-check" iconPos="right" severity="secondary"
                            @click="displaySelectedStudentsDialog = true" :badge="selectedStudents?.length.toString()" />
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
        </UtilsStudentsTable>
    </template>
<script setup lang="ts">
import { useStudentStore } from '~/store/studentStore';
import type { Student } from '~/data/types';
const studentStore = useStudentStore();

// ========== selectedStudents MODEL SHARED TO PARENT ==========
const selectedStudents = defineModel<Student[]>()

// ========== SelectedStudents DIALOG HANDLING==========
const displaySelectedStudentsDialog = ref(false);
const deleteFromSelectedStudents = (studentId: number) => {
    if (!selectedStudents.value) return;
    selectedStudents.value = selectedStudents.value.filter((student) => student.id !== studentId)
}

</script>