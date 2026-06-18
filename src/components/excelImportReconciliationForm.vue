<template>

    <div class="card flex justify-center">

        <Stepper value="1" linear class="w-4/5 sm:w-[40rem]">
            <StepList>
                <Step value="1" v-show="transferCandidates.length">نقل من أقسام أخرى</Step>
                <Step value="2" v-show="props.removeCandidates">المغادرون</Step>
                <Step value="3">التأكيد</Step>
            </StepList>
            <StepPanels>
                <!-- Step 1 : add season data -->
                <StepPanel v-slot="{ activateCallback }" value="1" v-if="props.transferCandidates.length">
                    <div class="flex flex-col gap-1">

                        <UtilsStudentsTable :students="transferCandidates" :globalSearchActive="true"
                            :settings="{ columnsToHide: ['phone_number', 'address', 'father'], clearSelectionOnClassChange: true }"
                            v-model="toTransfer"> <template #header>
                                <p class="text-lg">حدد الطلبة الذين سيتم نقلهم إلى {{ className }}</p>
                            </template>
                        </UtilsStudentsTable>
                    </div>
                    <div class="flex pt-12 justify-between">
                        <Button label="العودة" severity="secondary" iconPos="right" icon="pi pi-arrow-right"
                            @click="activateCallback('1')" />
                        <Button label="التالي" icon="pi pi-arrow-left" @click="nextStepClick(1, activateCallback)" />
                    </div>
                </StepPanel>

                <!-- Step 2 : If chosen to promote students, show a form to students' classes and their new grades -->
                <StepPanel v-slot="{ activateCallback }" value="2" v-if="props.removeCandidates.length">
                    <div class="flex flex-col gap-1">
                        <UtilsStudentsTable :students="props.removeCandidates" :globalSearchActive="true"
                            :settings="{ columnsToHide: ['phone_number', 'address', 'father'], clearSelectionOnClassChange: true }"
                            v-model="toRemove">
                            <template #header>
                                <p class="text-lg">لم يتواجد هؤلاء الطلبة في ملف الاكسل الذي رفعته, قم بتحديدهم وطريقة
                                    التعامل معهم</p>
                            </template>
                        </UtilsStudentsTable>
                        <Listbox :disabled="!Boolean(toRemove.length)" v-model="removeMethod" :options="selectOptions"
                            optionLabel="label" optionValue="value" checkmark :highlightOnSelect="false" />
                    </div>
                    <div class="flex pt-6 justify-between">
                        <Button label="العودة" severity="secondary" iconPos="right" icon="pi pi-arrow-right"
                            @click="activateCallback('1')" />
                        <Button label="التالي" icon="pi pi-arrow-left" @click="nextStepClick(2, activateCallback)" />
                    </div>
                </StepPanel>
            </StepPanels>

            <!-- Step 3 : If the promotions map is there, pick students that won't get promoted (Repeaters)  -->
            <StepPanel v-slot="{ activateCallback }" value="3">
                <div class="flex flex-col">
                    <p> يرجى التأكد من التغييرات التالية:</p>
                    <p v-show="props.transferCandidates.length">- <span v-if="toTransfer.length"> حددت ({{
                        toTransfer.length }})
                            طالبا ليتم نقلهم إلى {{ className }}
                        </span> <span v-else> لم يتم تحديد أي طالب ينضم إلى {{ className }} من الأقسام الأخرى</span>
                    </p>
                    <p v-show="props.removeCandidates.length">- <span v-if="toRemove.length"> حددت ({{
                        toTransfer.length }})
                            طالبا ليتم {{ confirmDeleteMessage }}
                        </span> <span v-else> لم يتم تحديد أي طالب ليتم حذفه</span>
                    </p>


                </div>
                <div class="flex pt-6 justify-between">
                    <Button label="العودة" severity="secondary" iconPos="right" icon="pi pi-arrow-right"
                        @click="activateCallback('2')" />
                    <Button label="إنهاء" icon="pi pi-arrow-left" @click="nextStepClick(3, activateCallback)" />
                </div>
            </StepPanel>
        </Stepper>
    </div>
</template>
<script setup lang="ts">
import { ArabicStudentStatus } from '~/data/static';
import type { Student, StudentStatus } from '~/data/types';


const props = defineProps<{
    toClassName?: string,
    transferCandidates: Student[],
    removeCandidates: Student[]
}>();

// ==========FORM EMIT==========
type ImportReconcile = {
    toTransfer: Student[],
    toRemove: Student[],
    removeMethod: StudentStatus | "delete"
}
const emit = defineEmits<{
    (e: 'import-reconcile', payload: ImportReconcile): void
}>()
const className = computed(() => props.toClassName ? `قسم ${props.toClassName}` : 'القسم المحدد'
)
const toTransfer = ref<Student[]>([])
const toRemove = ref<Student[]>([])
const removeMethod = ref<StudentStatus | "delete">('delete')

const selectOptions = Object.entries(ArabicStudentStatus).filter((i) => i[0] !== "active").map(([key, arabicTxt]) => ({
    label: "تسجيل  كـ" + arabicTxt + `ين`,
    value: key,
})).concat([
    { label: "حذف نهائي", value: "delete" },
]) as { label: string, value: StudentStatus | "delete" }[];

const confirmDeleteStatus = Object.entries(ArabicStudentStatus).filter((i) => i[0] !== "active").map(([key, arabicTxt]) => ({
    label: "نقلهم إلى قائمة الـ" + arabicTxt + `ين`,
    value: key,
})).concat([
    { label: "حذفهم حذفا نهائيا", value: "delete" },
]) as { label: string, value: StudentStatus | "delete" }[];

const confirmDeleteMessage = computed(() => confirmDeleteStatus.find(({ value }) => value === removeMethod.value)?.label)


// ========== NEXT CLICK HANDLING ==========
const nextStepClick = async (step: number, formActivateCallback: (value: string | number) => void) => {
    if (step === 3) {
        emit('import-reconcile', {
            toRemove: toRemove.value,
            removeMethod: removeMethod.value,
            toTransfer: toTransfer.value
        })
    }
    else {
        formActivateCallback((step + 1).toString())
    }
}
</script>
