<template>
    <div class="flex flex-col gap-4" :class="{ card: !isSeasonNew }">
        <Form ref="form" :initialValues="formatSeason()" :resolver="resolver" class="flex flex-col gap-4" @submit="onSubmit"
            v-slot="$form" :key="formKey">
            <!-- Season name -->
            <div class="flex flex-col gap-1">
                <InputText name="id" hidden fluid />
            </div>
            <div class="flex flex-col gap-1">
                <FloatLabel variant="on">
                    <InputText name="name" v-model="season.name" fluid />
                    <label>اسم السنة الدراسية</label>
                </FloatLabel>
                <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.name.error.message }}
                </Message>
            </div>

            <!-- Terms Loop-->
            <div v-for="(term, index) in season.terms" :key="index" class="border p-3 rounded flex flex-col gap-4">
                <strong>الفصل {{ index + 1 }}</strong>
                <div class="flex flex-col">
                    <FloatLabel variant="on">
                        <InputText :name="`terms[${index}].name`" v-model="season.terms[index].name" fluid />
                        <label>اسم الفصل</label>
                    </FloatLabel>
                    <Message v-if="Array.isArray($form.terms) && $form.terms?.[index]?.name?.invalid" severity="error"
                        size="small" variant="simple">
                        {{ $form.terms[index].name.error.message }}
                    </Message>
                </div>
                <div class="flex gap-4 flex-wrap">
                    <!-- Start Date -->
                    <div class="flex flex-col">

                        <FloatLabel variant="on">
                            <DatePicker :name="`terms[${index}].startDate`" v-model="season.terms[index].startDate"
                                :disabled="disableDatePicker('start', index)" fluid />
                            <label>تاريخ البداية</label>
                        </FloatLabel>
                        <Message v-if="Array.isArray($form.terms) && $form.terms?.[index]?.startDate?.invalid"
                            severity="error" size="small" variant="simple">
                            {{ $form.terms[index].startDate.error.message }}
                        </Message>
                    </div>
                    <!-- End Date -->
                    <div class="flex flex-col">
                        <FloatLabel variant="on">
                            <DatePicker :name="`terms[${index}].endDate`" v-model="season.terms[index].endDate"
                                :disabled="disableDatePicker('end', index)" fluid />
                            <label>تاريخ النهاية</label>
                        </FloatLabel>
                        <Message v-if="Array.isArray($form.terms) && $form.terms?.[index]?.endDate?.invalid"
                            severity="error" size="small" variant="simple">
                            {{ $form.terms[index].endDate.error.message }}
                        </Message>
                    </div>
                    <Button v-if="!isSeasonArchived" type="button" severity="danger" label="حذف الفصل"
                        @click="removeTerm(index)" />
                </div>
            </div>
            <div class="flex flex-col">
            <FormField name="terms" v-slot="{ error }">
                <Message v-if="error" severity="error" size="small" variant="simple">
                    {{ error.message }}</Message>
            </FormField>
            <Button class="my-1" v-if="!isSeasonArchived" type="button" :severity="isSeasonNew ? 'secondary' : 'info'" label="إضافة فصل" @click="addTerm" />
            <Button class="my-1" v-if="!isSeasonNew" type="submit" severity="success" label="حفظ" />
            </div>
        </Form>
    </div>
</template>

<script setup lang="ts">
import type { NewSchoolSeason, SchoolSeason, SeasonStatus } from '~/data/types';
import { yupResolver } from '@primevue/forms/resolvers/yup';
import * as yup from 'yup';
import type { FormInstance, FormSubmitEvent } from '@primevue/forms';
const { formatDatesForTerm, getRequiredFieldMessage, hasCollapsingTerms } = useDataUtils();
const props = defineProps<{
    status : SeasonStatus | 'new',
    season: SchoolSeason | NewSchoolSeason
}>()
const emit = defineEmits<{
    (e: 'update:season', season: SchoolSeason): void;
}>()
const isSeasonArchived = computed(()=> props.status === 'past')
const isSeasonNew = computed(()=> props.status === 'new')
const form = ref<FormInstance | null>(null)
/* Converts timestamps to dates to be usable by PrimeVue datePicker */
const formatSeason = (season: SchoolSeason | NewSchoolSeason = props.season) => {
    const base = {
        name: season.name,
        terms: season.terms.map(term => formatDatesForTerm(term))
    }
    return !("id" in season) ? base : { ...base, id: season.id }
}
/* Convert dates back to timestamps */
const toTimestamp = (value: unknown, originalValue: unknown) => {
    if (originalValue instanceof Date) {
        return originalValue.getTime();
    }
    return value;
};

const yupSchema: yup.ObjectSchema<Omit<SchoolSeason, 'id'>> =
    yup.object().shape({
        name: yup.string().required(getRequiredFieldMessage('اسم السنة الدراسية')).min(4, 'اسم السنة الدراسية يجب أن يكون على الأقل 4 أحرف'),
        terms: yup.array(
            yup.object({
                name: yup.string().required(getRequiredFieldMessage('اسم الفصل')).min(4, 'اسم الفصل يجب أن يكون على الأقل 4 أحرف'),
                startDate: yup.number().required(getRequiredFieldMessage('تاريخ البداية')).transform(toTimestamp),
                endDate: yup.number().required(getRequiredFieldMessage('تاريخ النهاية')).transform(toTimestamp).test(
                    'is-greater',
                    'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
                    function (value) {
                        const { startDate } = this.parent;
                        return value > startDate;
                    }
                ).test(
                    'more-than-three-days',
                    'مدة الفصل الدراسي لا تقل عن ثلاثة أيام',
                    function (value) {
                        const { startDate } = this.parent;
                        return value - startDate >= 259200000; // 3 days in milliseconds
                    }
                ),
            })
        ).test('terms-not-collapsing', 'يجب ألا تتداخل الفصول الدراسية مع بعضها', (value) => {
            return !value ? true : !hasCollapsingTerms(value)
        }).required().min(1, 'يجب أن تحتوي السنة الدراسية على فصل دراسي على الأقل'),
    })

const formKey = ref(1);
const season = ref(formatSeason());

const resolver = yupResolver(yupSchema);

const addTerm = () => {
    season.value.terms.push({
        name: '',
        startDate: undefined,
        endDate: undefined,
    });
    formKey.value++;
};

const removeTerm = (index: number) => {
    season.value.terms.splice(index, 1);
    formKey.value++;
};

const onSubmit = (validationObject: FormSubmitEvent) => {
    if (!validationObject.valid) return;
    emit('update:season', validationObject.values as SchoolSeason)
};

const disableDatePicker = (type: 'start' | 'end', termIndex: number) => {
    if (!isSeasonArchived.value) return false;
    return type === 'start' && termIndex === 0 ? true
        : type === 'end' && termIndex === props.season.terms.length - 1 ? true
            : false;
}

</script>