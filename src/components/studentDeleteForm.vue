<template>
    <div class="card flex flex-col items-center gap-5">
        <Toast />
        <Form :initialValues="getFormInitialValue()" v-slot="$form" :resolver="resolver" @submit="onFormSubmit"
            class="flex flex-col gap-4 w-full sm:w-80">
            <div class="flex flex-col gap-1">
                كيف تريد حذف التلاميذ المحددين من القسم؟
                <Listbox name="status" :options="selectOptions" optionLabel="label" optionValue="value" checkmark
                    :highlightOnSelect="false" />
                <Message v-if="$form.status?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.status.error?.message }}
                </Message>
            </div>

            <div class="flex flex-col gap-1">
                <FloatLabel variant="on">
                    <DatePicker name="exited_at" fluid showIcon />
                    <label>تاريخ الخروج</label>
                </FloatLabel>
                <Message v-if="$form.exited_at?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.exited_at.error?.message }}
                </Message>
            </div>
            {{ }}
            <!-- Submit -->
            <Button type="submit" label="إرسال" severity="secondary" />
        </Form>
    </div>

</template>
<script setup lang="ts">
import { ArabicStudentStatus } from "~/models/static"
import { zodResolver } from '@primevue/forms/resolvers/zod';
import type { FormSubmitEvent } from "@primevue/forms"
import { z } from 'zod';
import type { InactiveStudent, StudentStatus } from "~/models/types";

const emit = defineEmits<{
    (e: 'delete'): void;
    (e: 'change-status', student: Pick<InactiveStudent, "status" | "exited_at">): void;
}>()

const getFormInitialValue = () => {
    return {
        status: "dropped",
        exited_at: new Date(),
    }
}



const selectOptions = Object.entries(ArabicStudentStatus).filter((i) => i[0] !== "active").map(([key, arabicTxt]) => ({
    label: "تسجيل التلميذ كـ" + arabicTxt,
    value: key,
})).concat([
    { label: "حذف نهائي", value: "delete" },
]) as { label: string, value: StudentStatus | "delete" }[];

const deleteStudentsSchema = z.object({
    status: z.enum(['dropped', 'transferred', 'graduated', 'delete'], {
        error: getRequiredFieldMessage("طريقة الحذف", "choice")
    }),
    exited_at: z.date({ error: getRequiredFieldMessage("date") }).transform(d => d.getTime()),
})
const resolver = zodResolver(deleteStudentsSchema);

const onFormSubmit = (event: FormSubmitEvent) => {
    if (event.values.status === "delete") {
        emit("delete");
    } else {
        const { status, exited_at } = event.values;
        emit("change-status", { status, exited_at });
    }
}
</script>