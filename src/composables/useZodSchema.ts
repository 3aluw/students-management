import useDataUtils from "~/composables/useDataUtils";
import { z } from 'zod';
import type { Absence, Class, EditClass, EditStudent, Lateness, NewAbsence, NewClass, NewLateness, NewStudent, Student, } from '~/data/types';
const { getRequiredFieldMessage } = useDataUtils()


export default function () {
    // ========== Student schemas ==========
    const studentSchema = z.object({
        id: z.number({ error: getRequiredFieldMessage("id") }),
        status: z.enum(['active', 'graduated', 'dropped', 'transferred'], { error: getRequiredFieldMessage("status") }),
        first_name: z.string({ error: getRequiredFieldMessage("first_name") }).min(3, { message: 'يجب إدخال اسم الطالب كاملا' }),
        last_name: z.string({ error: getRequiredFieldMessage("last_name") }).min(3, { message: 'يجب إدخال اللقب كاملا ' }),
        father_name: z.string({ error: getRequiredFieldMessage("father_name") }).min(3, { message: 'يجب استكمال اسم الأب ' }),
        grandfather_name: z.string({ error: getRequiredFieldMessage("grandfather_name") }).min(3, { message: 'يجب استكمال اسم الجد ' }),
        class_id: z.number({ error: getRequiredFieldMessage("class_id") }),
        sex: z.literal(['F', 'M'], { error: getRequiredFieldMessage("sex") }),
        phone_number: z.string({ error: getRequiredFieldMessage("phone_number") }).length(10, { message: 'يجب إدخال رقم هاتف صحيح ' }),
        birth_date: z.date({ error: getRequiredFieldMessage("birth_date") }).transform(d => d.getTime()),
        address: z.string({ error: getRequiredFieldMessage("address") }).min(10, { message: 'يجب إدخال العنوان بدقة ' }),
    }) satisfies z.ZodType<Student>

    const newStudentSchema = studentSchema.omit({ id: true }) satisfies z.ZodType<NewStudent>
    const editStudentSchema = studentSchema.partial().required({ id: true }) satisfies z.ZodType<EditStudent>
    const batchEditStudentSchema = z.array(editStudentSchema.omit({ id: true }).extend({ ids: z.array(z.number()) }))

    const studentSchemas = { studentSchema, newStudentSchema, editStudentSchema, batchEditStudentSchema }
    // ========== Class schemas ==========

    const classSchema = z.object({
        id: z.number({ error: getRequiredFieldMessage("id") }),
        grade: z.number({ error: getRequiredFieldMessage("grade") }).max(10, { message: 'يرجى إدخال مستوى منطقي' }),
        school_level: z.literal(['primary', 'middle', 'high'], { error: getRequiredFieldMessage("school_level") }),
        section: z.string({ error: getRequiredFieldMessage("section") }),
    }) satisfies z.ZodType<Class>

    const newClassSchema = classSchema.omit({ id: true }) satisfies z.ZodType<NewClass>
    const editClassSchema = classSchema.partial().required({ id: true }) satisfies z.ZodType<EditClass>

    const classSchemas = { classSchema, newClassSchema, editClassSchema }
    // ========== Lateness schemas ==========
    const latenessSchema = z.object({
        id: z.number({ error: getRequiredFieldMessage("id") }),
        student_id: z.number({ error: getRequiredFieldMessage("student_id") }),
        date: z.date().transform(d => d.getTime()),
        reason: z.string().min(5, { message: 'يجب إدخال سبب الغياب' }),
        reason_accepted: z.literal([0, 1]),
        late_by: z.number({ error: getRequiredFieldMessage("مدة التأخر") }),      // it will be used to insert the time of enter then transformed to minutes after shift start
        start_time: z.number({ error: getRequiredFieldMessage("وقت البدء") }),
    }) satisfies z.ZodType<Lateness>
    const newLatenessSchema = latenessSchema.omit({ id: true }) satisfies z.ZodType<NewLateness>
    const editLatenessSchema = studentSchema.partial().required({ id: true }) satisfies z.ZodType<EditStudent>
    const batchEditLatenessSchema = z.array(editLatenessSchema.omit({ id: true }).extend({ ids: z.array(z.number()) }))

    const latenessSchemas = { latenessSchema, newLatenessSchema, editLatenessSchema, batchEditLatenessSchema }

    // ========== absence schemas ==========
    const absenceSchema = z.object({
        id: z.number({ error: getRequiredFieldMessage("id") }),
        student_id: z.number({ error: getRequiredFieldMessage("student_id") }),
        date: z.number({ error: getRequiredFieldMessage(" التاريخ") }),
        reason: z.string().min(5, { message: 'يجب إدخال سبب الغياب' }),
        reason_accepted: z.literal([0, 1]),
        start_time: z.number({ error: getRequiredFieldMessage("وقت البدء") }),
    }) satisfies z.ZodType<Absence>
    const newAbsenceSchema = absenceSchema.omit({ id: true }) satisfies z.ZodType<NewAbsence>
    const editAbsenceSchema = studentSchema.partial().required({ id: true }) satisfies z.ZodType<EditStudent>
    const batchEditAbsenceSchema = z.array(editAbsenceSchema.omit({ id: true }).extend({ ids: z.array(z.number()) }))

    const absenceSchemas = { absenceSchema, newAbsenceSchema, editAbsenceSchema, batchEditAbsenceSchema }

    return { studentSchemas, classSchemas, latenessSchemas, absenceSchemas }
}