<template>
    <div class="card flex flex-col items-center gap-5">
        <Toast />

        <Form v-if="props.eventType == 'absence'" :initialValues="formatEventObject()" v-slot="$form"
            :resolver="resolver" @submit="onFormSubmit" class="flex flex-col gap-4 w-full sm:w-80">
            <!-- absence Date -->
            <div class="flex flex-col gap-1">
                <DatePicker name="date" placeholder="تاريخ الغياب" fluid showIcon />
                <Message v-if="$form.birth_date?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.date.error?.message }}
                </Message>
            </div>

            <!-- Reason -->
            <div class="flex flex-col gap-1">
                <InputText name="reason" type="text" placeholder="سبب الغياب" fluid />
                <Message v-if="$form.first_name?.invalid" severity="error" size="small" variant="simple">{{
                    $form.reason.error.message }}</Message>

            </div>

            <!-- reason accepted -->
            <div class="flex flex-col gap-1">
                <SelectButton name="reason_accepted" :options="sqliteBoolean" optionLabel="label" optionValue="value" />
                <Message v-if="$form.sex?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.sex.error?.message }}
                </Message>
            </div>


            <!-- Submit -->
            <Button type="submit" label="إرسال" severity="secondary" />
        </Form>



        <Form v-else-if="props.eventType == 'lateness'" :initialValues="props.entityObject" v-slot="$form"
            :resolver="resolver" @submit="onFormSubmit" class="flex flex-col gap-4 w-full sm:w-80">
            <!-- Grade -->
            <div class="flex flex-col gap-1">
                <InputNumber name="grade" placeholder="المستوى" :min="0" :max="10" fluid />
                <Message v-if="$form.grade?.invalid" severity="error" size="small" variant="simple">{{
                    $form.grade.error.message }}</Message>
            </div>
            <!-- school_level -->
            <div class="flex flex-col gap-1">
                <Select name="school_level" :options="schoolLevelOptions" optionLabel="label" optionValue="value"
                    placeholder="اختر الصف" fluid />
                <Message v-if="$form.school_level?.invalid" severity="error" size="small" variant="simple">{{
                    $form.school_level.error.message }}</Message>
            </div>

            <!-- Section -->
            <div class="flex flex-col gap-1">
                <InputText name="section" type="text" placeholder="الحرف" fluid />
                <Message v-if="$form.section?.invalid" severity="error" size="small" variant="simple">{{
                    $form.section.error.message }}</Message>
            </div>
            <!-- Submit -->
            <Button type="submit" label="إرسال" severity="secondary" />
        </Form>
    </div>

</template>

<script setup lang="ts" generic="T extends 'absence' | 'lateness'">

import { useStudentStore } from '~/store/studentStore';
import { sqliteBoolean } from '~/data/static';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import { useToast } from 'primevue/usetoast';
import type { NewClass, NewStudent, Student, Class, Absence, Lateness, NewAbsence, NewLateness, LocalAbsence, AbsenceInfo } from '~/data/types';
import { schoolLevelOptions } from '~/data/static';
import type { FormSubmitEvent } from "@primevue/forms"
const { getRequiredFieldMessage } = useFormUtils()
const studentStore = useStudentStore();

const formatEventObject = () => {
if(props.eventType == 'absence' && props.entityObject){
    const absenceObj = props.entityObject as Absence
    return {
        ...absenceObj,
        date: new Date(absenceObj.date)
    }
}
}
const toast = useToast();

type Event<T extends 'absence' | 'lateness'> = T extends 'absence' ? AbsenceInfo : Lateness

type newEvent<T extends 'absence' | 'lateness'> = T extends 'absence' ? NewAbsence : NewLateness

const props = defineProps<{
    eventType: T;
    entityObject?: Event<T>
}>()

const emit = defineEmits<{
    (e: 'submit', obj: newEvent<T>): void;
}>()

const resolver = computed(() => props.eventType == 'absence' ? zodResolver(absenceZodSchema) :
    zodResolver(classZodSchema)
);
const absenceZodSchema = z.object({
    date: z.date().transform(d => d.getTime()),
    reason: z.string().min(5, { message: 'يجب إدخال سبب الغياب' }),
    reason_accepted: z.literal([0, 1])
}) satisfies z.ZodType<AbsenceInfo>

const classZodSchema = z.object({
    grade: z.number({ error: getRequiredFieldMessage("grade") }).max(10, { message: 'يرجى إدخال مستوى منطقي' }),
    school_level: z.literal(['primary', 'middle', 'high'], { error: getRequiredFieldMessage("school_level") }),
    section: z.string({ error: getRequiredFieldMessage("section") })
}) satisfies z.ZodType<NewClass>



const onFormSubmit = (event: FormSubmitEvent) => {
    if (!event.valid) return

    toast.add({ severity: 'info', summary: 'يتم معالجة طلبك', life: 3000 })
    emit('submit', event.values as newEvent<T>)
}

</script>
