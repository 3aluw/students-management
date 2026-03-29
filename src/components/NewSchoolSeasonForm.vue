<template>

    <div class="card flex justify-center">
        <Stepper value="2" linear class="w-4/5 sm:w-[40rem] ">
            <StepList>
                <Step value="1">بيانات الموسم</Step>
                <Step value="2">الطلاب</Step>
            </StepList>
            <StepPanels>
                <!-- Step 1 : add season data -->
                <StepPanel v-slot="{ activateCallback }" value="1">
                    <div class="flex flex-col gap-4">
                        <div v-show="props.isLastSeasonCurrent">
                            <p class="text-lg font-bold">الموسم الدراسي الحالي مازال مستمرا</p>
                            <div class="flex items-center" v-tooltip="terminateCurrentSeasonTooltipText">
                                <Checkbox id="terminateCurrentSeasonCheckbox" v-model="terminateCurrentSeason" binary />
                                <label for="terminateCurrentSeasonCheckbox" class="mr-2">
                                    <p>هل ترغب في إنهاء الموسم الدراسي الحالي قبل إضافة موسم دراسي جديد؟</p>
                                </label>
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
                        <Button label="التالي" icon="pi pi-arrow-left"
                            @click="handleStepOneNextClick(activateCallback)" />
                    </div>
                </StepPanel>

                <!-- Step 2 : If chosen to promote students, show a form to students' classes and their new grades -->
                <StepPanel v-slot="{ activateCallback }" value="2">
                    <div class="flex flex-col">
                        <div>
                            <p class="text-lg font-bold">نقل التلاميذ بصفة آلية</p>
                            <div class="flex items-center">
                                <Checkbox id="terminateCurrentSeasonCheckbox" v-model="terminateCurrentSeason" binary />
                                <label for="terminateCurrentSeasonCheckbox" class="mr-2">
                                    <p>هل ترغب في نقل التلاميذ إلى القسم التالي؟</p>
                                </label>
                            </div>
                        </div>
                        <StudentsPromotionForm />
                    </div>
                    <div class="pt-6">
                        <Button label="العودة" severity="secondary" iconPos="right" icon="pi pi-arrow-right"
                            @click="activateCallback('1')" />
                    </div>
                </StepPanel>
            </StepPanels>
        </Stepper>
    </div>
</template>
<script setup lang="ts">
import type { NewSchoolSeason, promoteStudentsMap } from '~/data/types';
/*A props used to suggest current season termination to the user */
const props = defineProps<{
    isLastSeasonCurrent: boolean;
}>();
type CreateSeasonWorkflowPayload = {
    terminateSeason: boolean
    addNewSeason: NewSchoolSeason
    promoteStudents: promoteStudentsMap | undefined
}
const emit = defineEmits<{
    'create-season-workflow': (payload: CreateSeasonWorkflowPayload) => void
}>()


/*Step 1 logic */
const terminateCurrentSeason = ref(false)
const terminateCurrentSeasonTooltipText = computed(() => `تحديد اليوم(${useDateFormat(new Date(), 'YYYY-MM-DD', { locales: 'ar-SA' }).value}) كآخر يوم للموسم الحالي `)
const newSeasonData = ref<NewSchoolSeason | null>(null)
const newSeason: NewSchoolSeason = {   // passed as a prop to the edit season form
    name: "",
    terms: [{
        name: "",
        startDate: new Date().getTime(),
        endDate: new Date().getTime(),
    }]
}
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
const handleStepOneNextClick = async (formActivateCallback: (value: string | number) => void) => { //runs when the user clicks next btn; if the form is valid proceed to 2nd step 
    const season = await getSeasonData()
    if (!season) return;
    newSeasonData.value = season;
    formActivateCallback('2')
}
/*Step 2 logic */
const promoteStudents = ref(false)
</script>