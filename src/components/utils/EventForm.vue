<template>
    <div class="card flex flex-col items-center gap-5">
        <Toast />

        <Form v-if="props.eventType == 'absence'" :initialValues="formatEventObject()" v-slot="$form"
            :resolver="resolver" @submit="onFormSubmit" class="flex flex-col gap-4 w-full sm:w-80">
            <!-- absence Date -->
            <div class="flex flex-col gap-1">
                <DatePicker name="date" placeholder="تاريخ الغياب" fluid showIcon />
                <Message v-if="$form.date?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.date.error?.message }}
                </Message>
            </div>

            <!-- Reason -->
            <div class="flex flex-col gap-1">
                <InputText name="reason" type="text" placeholder="سبب الغياب" fluid />
                <Message v-if="$form.reason?.invalid" severity="error" size="small" variant="simple">{{
                    $form.reason.error.message }}</Message>

            </div>

            <!-- reason accepted -->
            <div class="flex flex-col gap-1">
                <SelectButton name="reason_accepted" :options="sqliteBoolean" optionLabel="label" optionValue="value" />
                <Message v-if="$form.reason_accepted?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.reason_accepted.error?.message }}
                </Message>
            </div>


            <!-- Submit -->
            <Button type="submit" label="إرسال" severity="secondary" />
        </Form>

        <Form v-else-if="props.eventType == 'lateness'" :initialValues="formatEventObject()" v-slot="$form"
            :resolver="resolver" @submit="onFormSubmit" class="flex flex-col gap-4 w-full sm:w-80">
            {{ props.entityObject }}
            <!-- lateness Date -->
            <div class="flex flex-col gap-1">
                <DatePicker name="date" placeholder="تاريخ التأخر" fluid showIcon />
                <Message v-if="$form.date?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.date.error?.message }}
                </Message>
            </div>
            <div class="flex flex-col gap-1">
                <DatePicker name="start_time" placeholder="بداية الحصة" fluid timeOnly />
                <Message v-if="$form.start_time?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.start_time.error?.message }}
                </Message>
            </div>
            <div class="flex flex-col gap-1">
                <DatePicker name="late_by" placeholder="وقت الدخول" fluid timeOnly />
                <Message v-if="$form.late_by?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.late_by.error?.message }}
                </Message>
            </div>

            <!-- Reason -->
            <div class="flex flex-col gap-1">
                <InputText name="reason" type="text" placeholder="سبب الغياب" fluid />
                <Message v-if="$form.reason?.invalid" severity="error" size="small" variant="simple">{{
                    $form.reason.error.message }}</Message>
            </div>

            <!-- reason accepted -->
            <div class="flex flex-col gap-1">
                <SelectButton name="reason_accepted" :options="sqliteBoolean" optionLabel="label" optionValue="value" />
                <Message v-if="$form.reason_accepted?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.reason_accepted.error?.message }}
                </Message>
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
import type { NewAbsence, NewLateness, AbsenceInfo, LatenessInfo } from '~/data/types';
import type { FormSubmitEvent } from "@primevue/forms"
const { getDatesForEventInfo } = useFormUtils()
const studentStore = useStudentStore();

const formatEventObject = () => {
    if (props.entityObject && props.eventType == 'absence') {
        const entityObj = props.entityObject as AbsenceInfo
        return {
            ...entityObj,
            ...getDatesForEventInfo({date: entityObj.date})
        }
    }
    else {
        const entityObj = props.entityObject as LatenessInfo
        const { late_by, start_time, date } = entityObj
        return {
            ...entityObj,
            ...getDatesForEventInfo({date, late_by, start_time})
        }
    }
}
const toast = useToast();

type Event<T extends 'absence' | 'lateness'> = T extends 'absence' ? AbsenceInfo : LatenessInfo
type newEvent<T extends 'absence' | 'lateness'> = T extends 'absence' ? NewAbsence : NewLateness

const props = defineProps<{
    eventType: T;
    entityObject?: Event<T>;
}>()

const emit = defineEmits<{
    (e: 'submit', obj: Event<T>): void;
}>()

const resolver = computed(() => props.eventType == 'absence' ? zodResolver(absenceZodSchema) :
    zodResolver(latenessZodSchema)
);
const absenceZodSchema = z.object({
    date: z.date().transform(d => d.getTime()),
    reason: z.string().min(5, { message: 'يجب إدخال سبب الغياب' }),
    reason_accepted: z.literal([0, 1])
}) satisfies z.ZodType<AbsenceInfo>


const latenessZodSchema = (z.object({
    date: z.date().transform(d => d.getTime()),
    reason: z.string().min(5, { message: 'يجب إدخال سبب الغياب' }),
    reason_accepted: z.literal([0, 1]),
    late_by: z.date().transform(d => d.getTime()),      // it will be used to enter the time of enter and later transformed to minutes after shift start
    start_time: z.date().transform(d => d.getTime()),
}) satisfies z.ZodType<LatenessInfo>)
    .refine(
        (data) => data.late_by > data.start_time,
        { message: "وقت الدخول يجب أن يكون بعد بداية الحصة", path: ["late_by"] }
    )
    .transform((data) => {
        return {
            ...data,
            late_by: Math.floor((data.late_by - data.start_time) / 60000)
        }
    })



const onFormSubmit = (event: FormSubmitEvent) => {
    if (!event.valid) return
    toast.add({ severity: 'info', summary: 'يتم معالجة طلبك', life: 3000 })
    emit('submit', event.values as Event<T>)
}

</script>
