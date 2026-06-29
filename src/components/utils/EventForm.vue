<template>
    <div class="card flex flex-col items-center gap-5">
        <Toast />

        <Form :initialValues="formatEventObject()" v-slot="$form" :resolver="resolver" @submit="onFormSubmit"
            class="flex flex-col gap-4 w-full sm:w-80">

            <!-- Event Date -->
            <div class="flex flex-col gap-1">
                <FloatLabel variant="on">
                    <DatePicker name="date" fluid showIcon />
                    <label>تاريخ  {{ eventTypeInArabic }}</label>
                </FloatLabel>
                <Message v-if="$form.date?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.date.error?.message }}
                </Message>
            </div>

            <!-- Start Time -->
            <div class="flex flex-col gap-1">
                <FloatLabel variant="on">
                    <DatePicker name="start_time" fluid timeOnly />
                    <label>بداية الحصة</label>
                </FloatLabel>
                <Message v-if="$form.start_time?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.start_time.error?.message }}
                </Message>
            </div>

            <!-- For Lateness only : used to populate late_by-->
            <div v-if="props.eventType == 'lateness'" class="flex flex-col gap-1">
                <FloatLabel variant="on">
                    <DatePicker name="late_by" fluid timeOnly />
                    <label>وقت الدخول</label>
                </FloatLabel>
                <Message v-if="$form.late_by?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.late_by.error?.message }}
                </Message>
            </div>
            <!-- For infraction only : used to populate minutes_after_start-->
            <div v-if="props.eventType == 'infraction'" class="flex flex-col gap-1">
                <FloatLabel variant="on">
                    <DatePicker name="minutes_after_start" fluid timeOnly />
                    <label>وقت تجيل المخالفة</label>
                </FloatLabel>
                <Message v-if="$form.minutes_after_start?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.minutes_after_start.error?.message }}
                </Message>
            </div>

            <!-- Reason -->
            <div class="flex flex-col gap-1">
                <!-- Activate after primevue autocomplete issue #7633 is resolved
                  <AutoComplete :forceSelection="false" name="reason"  :suggestions="filteredReasons" @complete="searchReasons"
                    placeholder="سبب الغياب" :showEmptyMessage="false" fluid /> -->
                <FloatLabel variant="on">
                    <InputText name="reason" type="text" fluid />
                    <label>سبب  {{ eventTypeInArabic }}</label>
                </FloatLabel>
                <Message v-if="$form.reason?.invalid" severity="error" size="small" variant="simple">{{
                    $form.reason.error.message }}</Message>
            </div>

            <!-- Subject for infractions only -->
            <div v-if="props.eventType === 'infraction'" class="flex flex-col gap-1">
                <FloatLabel variant="on">
                    <InputText name="subject" type="text" fluid />
                    <label>المادة</label>
                </FloatLabel>
                <Message v-if="$form.subject?.invalid" severity="error" size="small" variant="simple">{{
                    $form.subject.error.message }}</Message>
            </div>
            <!-- reason accepted for lateness/ absence-->
            <div v-else class="flex flex-col gap-1" >
                <span>قبول العذر: </span>
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

<script setup lang="ts" generic="T extends EventType">
import { sqliteBoolean, commonReasons, eventTypesArabicDict } from '~/models/static';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z} from 'zod';
import { useToast } from 'primevue/usetoast';
import type { AbsenceInfo, LatenessInfo, EventType, InfractionInfo } from '~/models/types';
import type { FormSubmitEvent } from "@primevue/forms"
import { absenceSchemas, latenessSchemas, infractionSchemas } from "~/models/zod schemas"
import { parseEventTimeInfo } from "~/service/event"

const absenceSchema = absenceSchemas.absenceSchema
const latenessSchema = latenessSchemas.latenessSchema
const infractionSchema = infractionSchemas.infractionSchema

const toast = useToast();

//Format the object received from parent component to match the form initial values structure (to coincide with zod schemas)
const formatEventObject = () => {
    const entityObj = props.entityObject
    const { start_time, date } = entityObj
    if (props.eventType == 'absence') {
        const entityObj = props.entityObject as AbsenceInfo
        return {
            ...entityObj,
            ...parseEventTimeInfo({ date, start_time })
        }
    }
    else if (props.eventType == 'lateness') {
        const entityObj = props.entityObject as LatenessInfo
        return {
            ...entityObj,
            ...parseEventTimeInfo({ date, late_by: entityObj.late_by, start_time })
        }
    }
    else {
        const entityObj = props.entityObject as InfractionInfo
        return {
            ...entityObj,
            ...parseEventTimeInfo({ date, minutes_after_start: entityObj.minutes_after_start, start_time })
        }
    }
}

type EventInfo<T extends EventType> = T extends 'absence' ? AbsenceInfo : T extends 'lateness' ? LatenessInfo : InfractionInfo

const props = defineProps<{
    eventType: T;
    entityObject: EventInfo<T>;
}>()

const emit = defineEmits<{
    (e: 'submit', obj: EventInfo<T>): void;
}>()

const eventTypeInArabic = computed(() => eventTypesArabicDict[props.eventType])

const absenceInfoZodSchema = absenceSchema
    .omit({ id: true, student_id: true })
    .extend({
        date: z.date().transform(d => d.getTime()),
        start_time: z.date().transform(d => d.getTime()),
    })
    .transform((data) => ({
        ...data,
        start_time: minutesAfterMidnight(data.start_time),
    })) satisfies z.ZodType<AbsenceInfo>


const latenessInfoZodSchema = latenessSchema
    .omit({ id: true, student_id: true })
    .extend({
        date: z.date().transform(d => d.getTime()),
        start_time: z.date().transform(d => d.getTime()),
        late_by: z.date().transform(d => d.getTime()),      // it will be used to insert the time of enter then transformed to minutes after shift start

    }).refine(
        (data) => data.late_by > data.start_time,
        { message: "وقت الدخول يجب أن يكون بعد بداية الحصة", path: ["late_by"] }
    )
    .transform((data) => {
        return {
            ...data,
            late_by: minutesAfterMidnight(data.late_by) - minutesAfterMidnight(data.start_time),
            start_time: minutesAfterMidnight(data.start_time)
        }
    }) satisfies z.ZodType<LatenessInfo>

const infractionInfoZodSchema = infractionSchema
    .omit({ id: true, student_id: true })
    .extend({
        date: z.date().transform(d => d.getTime()),
        start_time: z.date().transform(d => d.getTime()),
        minutes_after_start: z.date().transform(d => d.getTime()),      // it will be used to insert the time of the infraction then transformed to minutes after shift start

    }).refine(
        (data) => data.minutes_after_start > data.start_time,
        { message: "وقت تسجيل المخالفة يجب أن يكون بعد بداية الحصة", path: ["minutes_after_start"] }
    )
    .transform((data) => {
        return {
            ...data,
            minutes_after_start: minutesAfterMidnight(data.minutes_after_start) - minutesAfterMidnight(data.start_time),
            start_time: minutesAfterMidnight(data.start_time)
        }
    }) satisfies z.ZodType<InfractionInfo>


const schemaMap = {
    absence: absenceInfoZodSchema,
    lateness: latenessInfoZodSchema,
    infraction: infractionInfoZodSchema
} as const satisfies Record<EventType, z.ZodType>

const schema = computed(() => schemaMap[props.eventType])
const resolver = computed(() => zodResolver(schema.value))

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
