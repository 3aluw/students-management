<template>
    <div class="card flex flex-col items-center gap-5">
        <Toast />
        <Form :initialValues="getFormInitialValue()" v-slot="$form" :resolver="resolver" @submit="onFormSubmit"
            class="flex flex-col gap-4 w-full sm:w-80">
            <div class="flex flex-col gap-1">
                <FloatLabel>
                    <Select name="class_id" :options="classOptions" optionLabel="label" optionValue="value" fluid />
                    <label>اختر القسم الذي سينتقل إليه التلاميذ</label>
                </FloatLabel>
                <Message v-if="$form.class_id?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.date.error?.message }}
                </Message>
            </div>

            <div class="flex flex-col gap-1" v-if="studentQuitStatus.includes($form?.class_id?.value)">
                <FloatLabel variant="on">
                    <DatePicker name="exited_at" fluid showIcon />
                    <label>تاريخ الخروج</label>
                </FloatLabel>
                <Message v-if="$form.exited_at?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.exited_at.error?.message }}
                </Message>
            </div>
            <!-- Submit -->
            <Button type="submit" label="إرسال" severity="secondary" />
        </Form>
    </div>

</template>
<script setup lang="ts">
import { useStudentStore } from '~/store/studentStore';
import { ArabicStudentStatus } from "~/data/static"
import { zodResolver } from '@primevue/forms/resolvers/zod';
import type { FormSubmitEvent } from "@primevue/forms"
import { optional, z } from 'zod';

const studentStore = useStudentStore();
const props = defineProps<{
    studentClassId: number,
}>()
const getFormInitialValue = () => {
    return {
        class_id: filteredClassOptions.value[0]?.value || 1,
        exited_at: undefined,
    }
}
const filteredClassOptions = computed(() =>
    studentStore.classOptions.filter(
        (classObject) =>
            classObject.value !== studentStore.selectedClassId
    )
);
const studentQuitStatus = ["dropped", "transferred", "graduated"] as const;
const quitClassOptions = Object.entries(ArabicStudentStatus).filter((i) => i[0] !== "active").map(([key, value]) => ({
    label: value,
    value: key,
}));
const classOptions = computed(() => [...filteredClassOptions.value, ...quitClassOptions]);

const transferStudentsSchema = z.union([
    z.object({
        class_id: z.number(),
        exited_at: z.date().optional().transform(d => d?.getTime()),
    }), z.object({
        class_id: z.enum(['dropped', 'transferred', 'graduated']),
        exited_at: z.date().transform(d => d.getTime()),
    })]);
const resolver = zodResolver(transferStudentsSchema);

const onFormSubmit = (event: FormSubmitEvent) => {
    console.log(event);
}
</script>