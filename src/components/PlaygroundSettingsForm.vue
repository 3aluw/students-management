<template>
    <Form :initialValues="formatSettingsObject()" v-slot="$form" :resolver="resolver" @submit="onFormSubmit"
        class="flex flex-col gap-4 items-start w-full sm:w-80">
        <div class="flex gap-2">
            وقت الدخول الافتراضي:
            <DatePicker name="defaultStartTime" placeholder="توقيت الدخول الافتراضي" fluid timeOnly />
            <Message v-if="$form.defaultStartTime?.invalid" severity="error" size="small" variant="simple">
                {{ $form.defaultStartTime.error?.message }}
            </Message>
        </div>

        <div class=" flex flex-col gap-2">
            <div class="flex items-center gap-2">
                تفعيل توقيت الإبطاء افتراضيا :
                <SelectButton name="dynamicTime" :options="ArabicBooleans" optionLabel="label" optionValue="value" />
                <Message v-if="$form.dynamicTime?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.dynamicTime.error?.message }}
                </Message>
            </div>
            <DatePicker v-if="!$form.dynamicTime?.value" name="defaultLateBy"
                placeholder="توقيت الدخول الافتراضي للطالب" fluid timeOnly />
            <Message v-if="$form.defaultLateBy?.invalid" severity="error" size="small" variant="simple">
                {{ $form.defaultLateBy.error?.message }}
            </Message>
        </div>

        <div class=" flex flex-col gap-2">
            <div class="flex items-center gap-2">
                الوضع السريع :
                <SelectButton name="fastMode" :options="ArabicBooleans" optionLabel="label" optionValue="value" />
            </div>
            <div v-if="$form.fastMode?.value" class="">
                    سبب الغياب / الإبطاء الافتراضي :
                <InputText name="defaultReason" type="text" placeholder="سبب الغياب" fluid />
                <Message v-if="$form.defaultReason?.invalid && $form.fastMode?.value" severity="error" size="small"
                    variant="simple">
                    {{ $form.defaultReason.error?.message }}
                </Message>
                <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                    قبول العذر افتراضيا :
                    <SelectButton name="reasonAcceptedByDefault" :options="sqliteBoolean" optionLabel="label"
                        optionValue="value" /></div>
                    <Message v-if="$form.reasonAcceptedByDefault?.invalid" severity="error" size="small"
                        variant="simple">
                        {{ $form.reasonAcceptedByDefault.error?.message }}
                    </Message>
                </div>
            </div>
        </div>
        <Button type="submit" label="تطبيق" severity="success" />

    </Form>
</template>
<script setup lang="ts">
import { ArabicBooleans, sqliteBoolean } from '~/data/static';
import type { PlaygroundSettings } from '~/data/types'
import { zodResolver } from '@primevue/forms/resolvers/zod';
import type { FormSubmitEvent } from "@primevue/forms"
const { minutesAfterMidnight, getDatesForPlaygroundSettings } = useDataUtils()
import { z } from 'zod';
const toast = useToast()

const props = defineProps<{
    settings: PlaygroundSettings
}>();
const emit = defineEmits<{
    (e: 'submit', settings: PlaygroundSettings): void
}>();

const formatSettingsObject = () => {
    const settings = props.settings as PlaygroundSettings
    return {
        ...settings,
        ...getDatesForPlaygroundSettings(props.settings)
    }
}

const schema = (z.object({
    defaultStartTime: z.date().transform(d => d.getTime()),
    defaultLateBy: z.date().transform(d => d.getTime()),      // it will be used to insert the time of enter then  transformed to minutes after shift start
    dynamicTime: z.boolean(),
    fastMode: z.boolean(),
    defaultReason: z.string().min(5, { message: 'يجب إدخال سبب الغياب' }),
    reasonAcceptedByDefault: z.literal([0, 1])
}) satisfies z.ZodType<PlaygroundSettings>)
    .transform((data) => {
        return {
            ...data,
            defaultStartTime: minutesAfterMidnight(data.defaultStartTime),
            defaultLateBy: minutesAfterMidnight(data.defaultLateBy) - minutesAfterMidnight(data.defaultStartTime)
        }
    })

const resolver = zodResolver(schema)
const onFormSubmit = (event: FormSubmitEvent) => {
    if (!event.valid) return
    if (event.values === undefined) {
        toast.add({ severity: 'warn', summary: 'لم تقم بأي تغيير على الإعدادات', life: 3000 })
        return;
    }
    emit('submit', event.values as PlaygroundSettings)
}

</script>