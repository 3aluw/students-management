<template>

    <div class="card flex justify-center">

        <Stepper value="1" linear class="w-4/5 sm:w-[40rem]">
            <StepList>
                <Step value="1">بيانات الموسم</Step>
                <Step value="2" v-show="seasonTerminationActive">الانتقال</Step>
                <Step value="3" v-show="seasonTerminationActive && studentPromotionActive">الرسوب</Step>
            </StepList>
            <StepPanels>
                <!-- Step 1 : add season data -->
                <StepPanel v-slot="{ activateCallback }" value="1">
                    <div class="flex flex-col gap-4">
                        <div class="my-2" v-show="props.isLastSeasonCurrent">
                            <div class="flex items-center" v-tooltip="terminateCurrentSeasonTooltipText">
                                <label for="terminateCurrentSeasonCheckbox">
                                    <p class="text-lg font-bold">إنهاء الموسم الدراسي الحالي</p>
                                </label>
                                <ToggleSwitch class="mx-4" id="terminateCurrentSeasonCheckbox"
                                    v-model="seasonTerminationActive" binary />
                            </div>
                        </div>
                        <div>
                            <p class="text-lg font-bold mb-0"> معلومات الموسم الدراسي الجديد</p>
                            <EditSchoolSeasonForm :status="'new'" :season="newSeason" ref="seasonFormRef"
                                @create:season="handleNewSeasonValues" />
                        </div>
                    </div>
                    <div class="flex pt-12 justify-between">
                        <Button label="العودة" severity="secondary" iconPos="right" icon="pi pi-arrow-right"
                            @click="activateCallback('1')" />
                        <Button label="التالي" icon="pi pi-arrow-left" @click="nextStepClick(1, activateCallback)" />
                    </div>
                </StepPanel>

                <!-- Step 2 : If chosen to promote students, show a form to students' classes and their new grades -->
                <StepPanel v-slot="{ activateCallback }" value="2" v-if="seasonTerminationActive">
                    <div class="flex flex-col">
                        <div>
                            <div class="flex items-center" v-tooltip="'سيسمح لك بمعالجة الراسبين لاحقا'">
                                <label for="terminateCurrentSeasonCheckbox" class="mr">
                                    <p class="text-lg font-bold">نقل الطلبة بصفة آلية</p>
                                </label>
                                <ToggleSwitch class="mx-4" id="terminateCurrentSeasonCheckbox"
                                    v-model="studentPromotionActive" binary />
                            </div>
                        </div>
                        <div :class="{ 'students-promotion-form': !studentPromotionActive }">
                            <StudentsPromotionForm ref="studentPromotionFormRef" />
                        </div>
                    </div>
                    <div class="flex pt-6 justify-between">
                        <Button label="العودة" severity="secondary" iconPos="right" icon="pi pi-arrow-right"
                            @click="activateCallback('1')" />
                        <Button label="التالي" icon="pi pi-arrow-left" @click="nextStepClick(2, activateCallback)" />
                    </div>
                </StepPanel>
            </StepPanels>

            <!-- Step 3 : If the promotions map is there, pick students that won't get promoted (Repeaters)  -->
            <StepPanel v-slot="{ activateCallback }" value="3" v-if="seasonTerminationActive && studentPromotionActive">
                <div class="flex flex-col">
                    <RepeatersTablePick v-model="repeaters" />
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
import type { NewSchoolSeason, PromoteStudentsMap, Student } from '~/data/types';
/*A prop used to suggest current season termination to the user */
const props = defineProps<{
    isLastSeasonCurrent: boolean;
}>();

// ========== MAIN FORM REACTIVE REFERENCES ==========
const newSeasonData = ref<NewSchoolSeason | null>(null)
const studentsPromotionObject = ref<PromoteStudentsMap | null>(null)
const repeaters = ref<Student[]>([])

// ==========FORM EMIT==========
type NewSeasonPayload = {
    terminateCurrentSeason: boolean
    newSeason: NewSchoolSeason
    promoteStudents: PromoteStudentsMap | undefined
    repeaters: Student[] | undefined
}

const emit= defineEmits<{
    (e: 'create-season',payload: NewSeasonPayload) : void
}>()


// ========== FORM STEPS LOGIC ==========
// Step 1 logic 
const seasonTerminationActive = ref(true)
const terminateCurrentSeasonTooltipText = computed(() => `تحديد اليوم (${useDateFormat(new Date(), 'YYYY-MM-DD', { locales: 'ar-SA' }).value}) كآخر يوم للموسم الحالي `)

const newSeason: NewSchoolSeason = {   // passed as a prop to the edit season form
    name: "",
    terms: [{
        name: "",
        startDate: new Date().getTime(),
        endDate: new Date().getTime(),
    }]
}
// on Next press in step 1, it will submit the form in the edit season form component using the exposed function submitForm.
let resolveSeason: ((v: NewSchoolSeason | undefined) => void) | null = null
const seasonFormRef = ref<null | { submitForm: () => void }>(null)  // A ref to edit season form; used to call the exposed function : submitForm

const getSeasonData = () =>    // returns a Promise that will be resolved later by handleNewSeasonValues
    new Promise<NewSchoolSeason | undefined>((resolve) => {
        resolveSeason = resolve
        seasonFormRef.value?.submitForm()
    })

const handleNewSeasonValues = (...args: [valid: false] | [valid: true, season: NewSchoolSeason]) => { //emit will run this function; and it will resolve the promise
    if (args.length === 1 && args[0] === false) { // in case of invalid form
        resolveSeason?.(undefined)
    } else { //in case of valid form
        const [valid, season,] = args; // valid: true, season: NewSchoolSeason, 
        resolveSeason?.(season)
    }
}
// Step 2 logic 
const allowStudentPromotion = computed(() => seasonTerminationActive.value || !props.isLastSeasonCurrent)
const studentPromotionActive = ref(false)  // whether the user wants to promote students or not; used in the final emitted payload
const studentPromotionFormRef = ref<null | { promotionMapObject: Record<number, number> }>(null) // a ref to the students promotion component (used to get teh exposed data)

// ========== NEXT CLICK HANDLING ==========
const nextStepClick = async (step: number, formActivateCallback: (value: string | number) => void) => {
    if (step === 1) {
        const season = await getSeasonData()
        if (!season) return;
        newSeasonData.value = season;
    }
    else if (step === 2) {
        if (studentPromotionActive.value && allowStudentPromotion.value) {
            studentsPromotionObject.value = studentPromotionFormRef.value?.promotionMapObject!
        }
    }
    else if (step === 3) {
        emit('create-season', {
            terminateCurrentSeason: seasonTerminationActive.value,
            newSeason: newSeasonData.value!,
            promoteStudents: studentsPromotionObject.value!,
            repeaters: repeaters.value.length > 0 ? repeaters.value : undefined
        })
    }
    formActivateCallback((step + 1).toString())
}
</script>

<style scoped>
.students-promotion-form {
    pointer-events: none;
    filter: blur(0.5px);
    opacity: 0.7;
}
</style>