
import { z } from 'zod';
import type { Class, NewClass, NewStudent, Student, } from '~/data/types';
const { getRequiredFieldMessage } = useDataUtils()


export default function () {
    // ========== Student schema ==========
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

    // ========== Class schema ==========

    const classSchema = z.object({
        id: z.number({ error: getRequiredFieldMessage("id") }),
        grade: z.number({ error: getRequiredFieldMessage("grade") }).max(10, { message: 'يرجى إدخال مستوى منطقي' }),
        school_level: z.literal(['primary', 'middle', 'high'], { error: getRequiredFieldMessage("school_level") }),
        section: z.string({ error: getRequiredFieldMessage("section") })
    }) satisfies z.ZodType<Class>

    const newClassSchema = classSchema.omit({ id: true }) satisfies z.ZodType<NewClass>

    return { studentSchema, classSchema, newStudentSchema, newClassSchema }
}