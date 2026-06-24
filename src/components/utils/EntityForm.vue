<template>
    <div class="card flex flex-col items-center gap-5">
        <Toast />
        <Form v-if="props.entityType == 'student'" :initialValues="formattedStudentObject" v-slot="$form"
            :resolver="resolver" @submit="onFormSubmit" class="flex flex-col gap-4 w-full sm:w-80">

            <!-- Status HIDDEN-->
            <div class="flex flex-col gap-1">
                <InputText name="status" type="text" fluid disabled hidden readonly />
            </div>
            <!-- Exited_at HIDDEN-->
            <div class="flex flex-col gap-1">
                <InputText name="exited_at" type="text" fluid disabled hidden readonly />
            </div>

            <!-- First Name -->
            <div class="flex flex-col gap-1">
                <FloatLabel variant="on">
                    <InputText name="first_name" type="text" fluid />
                    <label>الاسم</label>
                </FloatLabel>
                <Message v-if="$form.first_name?.invalid" severity="error" size="small" variant="simple">{{
                    $form.first_name.error.message }}</Message>
            </div>

            <!-- Last Name -->
            <div class="flex flex-col gap-1">
                <FloatLabel variant="on">
                    <InputText name="last_name" fluid />
                    <label>اللقب</label>
                </FloatLabel>
                <Message v-if="$form.last_name?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.last_name.error?.message }}
                </Message>
            </div>

            <!-- Father Name -->
            <div class="flex flex-col gap-1">
                <FloatLabel variant="on">
                    <InputText name="father_name" fluid />
                    <label>اسم الأب</label>
                </FloatLabel>
                <Message v-if="$form.father_name?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.father_name.error?.message }}
                </Message>
            </div>

            <!-- Grandfather Name -->
            <div class="flex flex-col gap-1">
                <FloatLabel variant="on">
                    <InputText name="grandfather_name" fluid />
                    <label>اسم الجد</label>
                </FloatLabel>
                <Message v-if="$form.grandfather_name?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.grandfather_name.error?.message }}
                </Message>
            </div>

            <!-- Class ID -->
            <div class="flex flex-col gap-1">
                <FloatLabel variant="on">
                    <Select name="class_id" :options="studentStore.classOptions" optionLabel="label" optionValue="value"
                        fluid />
                    <label>الصف</label>
                </FloatLabel>
                <Message v-if="$form.class_id?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.class_id.error?.message }}
                </Message>
            </div>

            <!-- Gender -->
            <div class="flex flex-col gap-1">
                <span>الجنس: </span>
                <SelectButton name="sex" :options="genderOptions" optionLabel="label" optionValue="value" />
                <Message v-if="$form.sex?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.sex.error?.message }}
                </Message>
            </div>

            <!-- Phone Number -->
            <div class="flex flex-col gap-1">
                <FloatLabel variant="on">
                    <InputText name="phone_number" fluid />
                    <label>رقم الهاتف</label>
                </FloatLabel>
                <Message v-if="$form.phone_number?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.phone_number.error?.message }}
                </Message>
            </div>

            <!-- Birth Date -->
            <div class="flex flex-col gap-1">
                <FloatLabel variant="on">
                    <DatePicker name="birth_date" fluid showIcon />
                    <label>تاريخ الميلاد</label>
                </FloatLabel>
                <Message v-if="$form.birth_date?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.birth_date.error?.message }}
                </Message>
            </div>

            <!-- Address -->
            <div class="flex flex-col gap-1">
                <FloatLabel variant="on">
                    <Textarea name="address" autoResize rows="3" fluid />
                    <label>العنوان الكامل</label>
                </FloatLabel>
                <Message v-if="$form.address?.invalid" severity="error" size="small" variant="simple">
                    {{ $form.address.error?.message }}
                </Message>
            </div>

            <!-- Submit -->
            <Button type="submit" label="إرسال" severity="secondary" />
        </Form>



        <Form v-else-if="props.entityType == 'class'" :initialValues="props.entityObject" v-slot="$form"
            :resolver="resolver" @submit="onFormSubmit" class="flex flex-col gap-4 w-full sm:w-80">
            <!-- Grade -->
            <div class="flex flex-col gap-1">
                <FloatLabel variant="on">
                    <InputNumber name="grade" :min="0" :max="10" fluid />
                    <label>المستوى (بالأرقام)</label>
                </FloatLabel>
                <Message v-if="$form.grade?.invalid" severity="error" size="small" variant="simple">{{
                    $form.grade.error.message }}</Message>
            </div>
            <!-- school_level -->
            <div class="flex flex-col gap-1">
                <FloatLabel variant="on">
                    <Select name="school_level" :options="schoolLevelOptions" optionLabel="label" optionValue="value"
                        fluid />
                    <label>المرحلة</label>
                </FloatLabel>
                <Message v-if="$form.school_level?.invalid" severity="error" size="small" variant="simple">{{
                    $form.school_level.error.message }}</Message>
            </div>

            <!-- Section -->
            <div class="flex flex-col gap-1">
                <FloatLabel variant="on">
                    <InputText name="section" type="text" fluid />
                    <label>الحرف</label>
                </FloatLabel>
                <Message v-if="$form.section?.invalid" severity="error" size="small" variant="simple">{{
                    $form.section.error.message }}</Message>
            </div>
            <!-- Submit -->
            <Button type="submit" label="إرسال" severity="secondary" />
        </Form>
    </div>

</template>

<script setup lang="ts" generic="T extends 'student' | 'class'">

import { useStudentStore } from '~/store/studentStore';
import { genderOptions } from '~/data/static';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import { useToast } from 'primevue/usetoast';
import type { NewClass, NewStudent, Student, Class } from '~/data/types';
import { schoolLevelOptions } from '~/data/static';
import type { FormSubmitEvent } from "@primevue/forms"
import { studentSchemas, classSchemas } from "~/models/zod schemas"
const studentStore = useStudentStore();


const toast = useToast();

type Entity<T extends 'student' | 'class'> = T extends 'student' ? Student : Class

type newEntity<T extends 'student' | 'class'> = T extends 'student' ? NewStudent : NewClass

const props = defineProps<{
    entityType: T;
    entityObject?: Entity<T>
}>()

const formattedStudentObject = computed(() => {
    // Fomrat student object to be compatible with the form, By formatting the birth_date & adding default status if not provided (in case of new student)
    if (props.entityType === 'student') {
        const studentObj = props.entityObject as Student
        const defaultBrithDate = new Date().getTime() - 1000 * 60 * 60 * 24 * 365 * 10 // 10 years ago
        return { ...studentObj, birth_date: new Date(studentObj?.birth_date || defaultBrithDate), status: studentObj?.status || "active", exited_at: studentObj?.exited_at || undefined }
    }
})

const emit = defineEmits<{
    (e: 'submit', obj: newEntity<T>): void;
}>()

const resolver = computed(() => props.entityType == 'student' ? zodResolver(studentZodSchema) :
    zodResolver(classZodSchema)
);
const studentZodSchema = studentSchemas.newStudentSchema.extend({
    birth_date: z.date({ error: getRequiredFieldMessage("birth_date") }).transform(d => d.getTime())
}) satisfies z.ZodType<NewStudent>
const classZodSchema = classSchemas.newClassSchema satisfies z.ZodType<NewClass>


const onFormSubmit = (event: FormSubmitEvent) => {
    if (!event.valid) return
    toast.add({ severity: 'info', summary: 'يتم معالجة طلبك', life: 3000 })
    emit('submit', event.values as newEntity<T>)
}

</script>
