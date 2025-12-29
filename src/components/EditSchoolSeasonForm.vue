<template>
    <div class="card flex flex-col gap-4">
        <Toast />

        <Form :initialValues="season" :resolver="resolver" class="flex flex-col gap-4" @submit="onSubmit" v-slot="$form"
            :key="formKey">
            Data in form: {{ $form }}
            <!-- Season name -->
            <div class="flex flex-col gap-1">
                <InputText name="name" v-model="season.name" placeholder="اسم السنة الدراسية" fluid />
                <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.name.error.message }}
                </Message>
            </div>

            <!-- Terms -->
            <div v-for="(term, index) in season.terms" :key="index" class="border p-3 rounded flex flex-col gap-2">
                <strong>الفصل {{ index + 1 }}</strong>

                <InputText :name="`terms[${index}].name`" v-model="season.terms[index].name" placeholder="اسم الفصل" fluid />
                <Message v-if="Array.isArray($form.terms) && $form.terms?.[index]?.name?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.terms[index].name.error.message }}
                </Message>

                <InputNumber :name="`terms[${index}].startDate`" v-model="season.terms[index].startDate"
                    placeholder="تاريخ البداية (timestamp)" fluid />
                <Message v-if="Array.isArray($form.terms) && $form.terms?.[index]?.startDate?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.terms[index].startDate.error.message }}
                </Message>

                <InputNumber :name="`terms[${index}].endDate`" v-model="season.terms[index].endDate"
                    placeholder="تاريخ النهاية (timestamp)" fluid />
                <Message v-if="Array.isArray($form.terms) && $form.terms?.[index]?.endDate?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.terms[index].endDate.error.message }}
                </Message>

                <Button type="button" severity="danger" label="حذف الفصل" @click="removeTerm(index)" />
            </div>

            <Button type="button" severity="info" label="إضافة فصل" @click="addTerm" />

            <Button type="submit" severity="secondary" label="حفظ" />
        </Form>
        errors: {{ errors }}
    </div>
</template>

<script setup lang="ts">
import type { NewSchoolSeason, SchoolSeason } from '~/data/types';
import { yupResolver } from '@primevue/forms/resolvers/yup';
import * as yup from 'yup';
import type { FormSubmitEvent } from '@primevue/forms';
const props = defineProps<{
    archived: boolean,
    season: SchoolSeason
}>()
const form = ref(null)

const yupSchema :  yup.ObjectSchema<Omit<SchoolSeason, 'id'>>  = 
    yup.object().shape({
        name: yup.string().required('اسم السنة الدراسية مطلوب').min(4, 'اسم السنة الدراسية يجب أن يكون على الأقل 4 أحرف'),
        terms: yup.array(
            yup.object({
                name: yup.string().required('اسم الفصل مطلوب').min(4, 'اسم الفصل يجب أن يكون على الأقل 4 أحرف'),
                startDate: yup.number().required('تاريخ البداية مطلوب').min(10, 'تاريخ البداية يجب أن يكون رقمًا صحيحًا'),
                endDate: yup.number().required('تاريخ النهاية مطلوب').min(10, 'تاريخ النهاية يجب أن يكون رقمًا صحيحًا'),
            })
        ).required().min(1, 'يجب أن تحتوي السنة الدراسية على فصل دراسي على الأقل'),
    }) 

const toast = useToast();
const formKey = ref(1);
const errors = ref({});

const season = ref<NewSchoolSeason>(props.season);

const resolver = yupResolver(yupSchema);

const addTerm = () => {
    season.value.terms.push({
        name: '',
        startDate: 0,
        endDate: 0,
    });
    formKey.value++;
};

const removeTerm = (index: number) => {
    season.value.terms.splice(index, 1);
    formKey.value++;
};

const onSubmit = (validationObject: FormSubmitEvent) => {
  console.log(validationObject);
  errors.value = validationObject.errors;
};

</script>