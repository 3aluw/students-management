<template>
    <div class="card flex flex-col items-center gap-5">
        <Toast />
        <Form v-if="props.entityType == 'student'" v-slot="$form" :resolver="resolver" @submit="onFormSubmit"
            class="flex flex-col gap-4 w-full sm:w-80">
            <!-- First Name -->
            <div class="flex flex-col gap-1">
                <InputText name="first_name" type="text" placeholder="الاسم" fluid />
                <Message v-if="$form.first_name?.invalid" severity="error" size="small" variant="simple">{{
                    $form.first_name.error.message }}</Message>

            </div>
            <!-- Last Name -->
            <div class="flex flex-col gap-1">
                <InputText name="last_name" placeholder="اللقب" fluid />
                <Message v-if="$form.last_name?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.last_name.error?.message }}
                </Message>
            </div>

            <!-- Father Name -->
            <div class="flex flex-col gap-1">
                <InputText name="father_name" placeholder="اسم الأب" fluid />
                <Message v-if="$form.father_name?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.father_name.error?.message }}
                </Message>
            </div>

            <!-- Grandfather Name -->
            <div class="flex flex-col gap-1">
                <InputText name="grandfather_name" placeholder="اسم الجد" fluid />
                <Message v-if="$form.grandfather_name?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.grandfather_name.error?.message }}
                </Message>
            </div>

            <!-- Class ID -->
            <div class="flex flex-col gap-1">
                <Select name="class_id" :options="classOptions" optionLabel="label" optionValue="value"
                    placeholder="اختر الصف" fluid />
                <Message v-if="$form.class_id?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.class_id.error?.message }}
                </Message>
            </div>

            <!-- Gender -->
            <div class="flex flex-col gap-1">
                <SelectButton name="sex" :options="genderOptions" optionLabel="label" optionValue="value" />
                <Message v-if="$form.sex?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.sex.error?.message }}
                </Message>
            </div>

            <!-- Phone Number -->
            <div class="flex flex-col gap-1">
                <InputText name="phone_number" placeholder="رقم الهاتف" fluid />

                <Message v-if="$form.phone_number?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.phone_number.error?.message }}
                </Message>
            </div>

            <!-- Birth Date -->
            <div class="flex flex-col gap-1">
                <DatePicker name="birth_date" placeholder="تاريخ الميلاد" fluid showIcon />
                <Message v-if="$form.birth_date?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.birth_date.error?.message }}
                </Message>
            </div>

            <!-- Address -->
            <div class="flex flex-col gap-1">
                <Textarea name="address" placeholder="العنوان الكامل" autoResize rows="3" fluid />
                <Message v-if="$form.address?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.address.error?.message }}
                </Message>
            </div>

            <!-- Submit -->
            <Button type="submit" label="إرسال" severity="secondary" />
        </Form>

        <Form v-else-if="props.entityType == 'class'" v-slot="$form" :resolver="resolver" @submit="onFormSubmit"
            class="flex flex-col gap-4 w-full sm:w-80">
            <!-- Level -->
            <div class="flex flex-col gap-1">
                <InputNumber  name="level" placeholder="المستوى" :min="0" :max="10" fluid />
                <Message v-if="$form.level?.invalid" severity="error" size="small" variant="simple">{{
                    $form.level.error.message }}</Message>
            </div>

            <!-- Abbreviation -->
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

<script setup lang="ts">
import { useStudentStore } from '~/store/studentStore';
import { genderOptions } from '~/data/static';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import { useToast } from 'primevue/usetoast';
import type { NewClass, NewStudent } from '~/data/types';
import type { FormSubmitEvent } from "@primevue/forms"
const { getRequiredFieldMessage } = useFormUtils()
const studentStore = useStudentStore();

const classOptions = computed(() => {
    return studentStore.classes.map(cls => ({
        label: cls.level + cls.section,
        value: cls.id,
    }))
})
const toast = useToast();

const props = defineProps<{
    entityType: "student" | "class";
}>()
const initialValues = ref({
    first_name: '',
    last_name: '',
    father_name: '',
    grandfather_name: '',
    class_id: undefined,
    sex: "M",
    phone_number: '',
    birth_date: undefined,
    address: '',
});


const resolver = computed(() => props.entityType == 'student' ? zodResolver(studentZodSchema) :
    zodResolver(classZodSchema)
);
const studentZodSchema = z.object({
    first_name: z.string({ error: getRequiredFieldMessage("first_name") }).min(3, { message: 'يجب إدخال اسم الطالب كاملا' }),
    last_name: z.string({ error: getRequiredFieldMessage("last_name") }).min(3, { message: 'يجب إدخال اللقب كاملا ' }),
    father_name: z.string({ error: getRequiredFieldMessage("father_name") }).min(3, { message: 'يجب استكمال اسم الأب ' }),
    grandfather_name: z.string({ error: getRequiredFieldMessage("grandfather_name") }).min(3, { message: 'يجب استكمال اسم الجد ' }),
    class_id: z.number({ error: getRequiredFieldMessage("class_id") }),
    sex: z.literal(['F', 'M'], { error: getRequiredFieldMessage("sex") }),
    phone_number: z.string({ error: getRequiredFieldMessage("phone_number") }).length(10, { message: 'يجب إدخال رقم هاتف صحيح ' }),
    birth_date: z.date({ error: getRequiredFieldMessage("birth_date") }).transform(d => d.getTime()),
    address: z.string({ error: getRequiredFieldMessage("address") }).min(10, { message: 'يجب إدخال العنوان بدقة ' }),
}) satisfies z.ZodType<NewStudent>

const classZodSchema = z.object({
    level: z.number({ error: getRequiredFieldMessage("level") }).max(10, { message: 'يرجى إدخال مستوى منطقي' }),
    section: z.string({ error: getRequiredFieldMessage("section") })
}) satisfies z.ZodType<NewClass>



const onFormSubmit = (event: FormSubmitEvent) => {
    if (event.valid) {
        toast.add({ severity: 'success', summary: 'Form is submitted.', life: 3000 });
    }
}


</script>
