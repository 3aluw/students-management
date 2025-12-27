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
            <div class="flex flex-col gap-1">
                <DatePicker name="start_time" placeholder="بداية الحصة" fluid timeOnly />
                <Message v-if="$form.start_time?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.start_time.error?.message }}
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
                <!-- Activate after primevue autocomplete issue #7633 is resolved
                  <AutoComplete :forceSelection="false" name="reason"  :suggestions="filteredReasons" @complete="searchReasons"
                    placeholder="سبب الغياب" :showEmptyMessage="false" fluid /> -->
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

<script setup lang="ts" generic="T extends EventTypes">
import { sqliteBoolean, commonReasons } from '~/data/static';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import { useToast } from 'primevue/usetoast';
import type { NewAbsence, NewLateness, AbsenceInfo, LatenessInfo, EventTypes } from '~/data/types';
import type { FormSubmitEvent } from "@primevue/forms"
const { getDatesForEventInfo, minutesAfterMidnight } = useDataUtils()
const toast = useToast();

const formatEventObject = () => {
    const entityObj = props.entityObject
    const { start_time, date } = entityObj
    if (props.eventType == 'absence') {
        const entityObj = props.entityObject as AbsenceInfo
        return {
            ...entityObj,
            ...getDatesForEventInfo({ date, start_time })
        }
    }
    else {
        const entityObj = props.entityObject as LatenessInfo
        return {
            ...entityObj,
            ...getDatesForEventInfo({ date, late_by: entityObj.late_by, start_time })
        }
    }
}

type EventInfo<T extends EventTypes> = T extends 'absence' ? AbsenceInfo : LatenessInfo
type newEvent<T extends EventTypes> = T extends 'absence' ? NewAbsence : NewLateness

const props = defineProps<{
    eventType: T;
    entityObject: EventInfo<T>;
}>()

const emit = defineEmits<{
    (e: 'submit', obj: EventInfo<T>): void;
}>()

const resolver = computed(() => props.eventType == 'absence' ? zodResolver(absenceZodSchema) :
    zodResolver(latenessZodSchema)
);
const absenceZodSchema = (z.object({
    date: z.date().transform(d => d.getTime()),
    start_time: z.date().transform(d => d.getTime()),
    reason: z.string().min(5, { message: 'يجب إدخال سبب الغياب' }),
    reason_accepted: z.literal([0, 1])
}) satisfies z.ZodType<AbsenceInfo>)
    .transform((data) => {
        return {
            ...data,
            start_time: minutesAfterMidnight(data.start_time)
        }
    })



const latenessZodSchema = (z.object({
    date: z.date().transform(d => d.getTime()),
    reason: z.string().min(5, { message: 'يجب إدخال سبب الغياب' }),
    reason_accepted: z.literal([0, 1]),
    late_by: z.date().transform(d => d.getTime()),      // it will be used to insert the time of enter then transformed to minutes after shift start
    start_time: z.date().transform(d => d.getTime()),
}) satisfies z.ZodType<LatenessInfo>)
    .refine(
        (data) => data.late_by > data.start_time,
        { message: "وقت الدخول يجب أن يكون بعد بداية الحصة", path: ["late_by"] }
    )
    .transform((data) => {
        return {
            ...data,
            late_by: minutesAfterMidnight(data.late_by) - minutesAfterMidnight(data.start_time),
            start_time: minutesAfterMidnight(data.start_time)
        }
    })



const onFormSubmit = (event: FormSubmitEvent) => {
    if (!event.valid) return
    toast.add({ severity: 'info', summary: 'يتم معالجة طلبك', life: 3000 })
    emit('submit', event.values as EventInfo<T>)
}

/* Reasons Autocomplete filtering logic */
const filteredReasons = ref<string[]>([])
function searchReasons(e: { query: string }) {
    const { query } = e
    filteredReasons.value = !query.length ? commonReasons : commonReasons.filter((reasons) => {
        return reasons.startsWith(query)
    })
}
</script>
