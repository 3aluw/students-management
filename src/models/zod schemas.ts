import { z } from "zod";
import type {
  Absence,
  ActiveStudent,
  BaseStudent,
  BatchEditAbsence,
  BatchEditLateness,
  BatchEditStudent,
  Class,
  EditClass,
  EditLateness,
  EditSchoolSeason,
  EditStudent,
  InactiveStudent,
  Lateness,
  NewAbsence,
  NewClass,
  NewLateness,
  NewSchoolSeason,
  NewSeasonPayload,
  NewStudent,
  NewXLSXStudent,
  SchoolSeason,
  Student,
  XLSXStudent,
} from "~/models/types";
import { getRequiredFieldMessage } from "~/utils/arabic-properties";
import { hasCollapsingTerms } from "~/service/season";
import { toTimestamp } from "~/utils/date";

// ========== Student schemas ==========
const studentBaseSchema = z.object({
  id: z.number({ error: getRequiredFieldMessage("id") }),
  first_name: z
    .string({ error: getRequiredFieldMessage("first_name") })
    .min(3, { message: "يجب إدخال اسم الطالب كاملا" })
    .max(15),
  last_name: z
    .string({ error: getRequiredFieldMessage("last_name") })
    .min(3, { message: "يجب إدخال اللقب كاملا " })
    .max(15),
  father_name: z
    .string({ error: getRequiredFieldMessage("father_name") })
    .min(3, { message: "يجب استكمال اسم الأب " })
    .max(15),
  grandfather_name: z
    .string({ error: getRequiredFieldMessage("grandfather_name") })
    .min(3, { message: "يجب استكمال اسم الجد " })
    .max(15),
  sex: z.literal(["F", "M"]),
  phone_number: z
    .string({ error: getRequiredFieldMessage("phone_number") })
    .length(10, { message: "يجب إدخال رقم هاتف صحيح " }),
  birth_date: z.number({ error: getRequiredFieldMessage("birth_date") }),
  address: z
    .string({ error: getRequiredFieldMessage("address") })
    .min(5, { message: "يجب إدخال العنوان بدقة " })
    .max(30),
}) satisfies z.ZodType<BaseStudent>;

const activeStudentSchema = studentBaseSchema.extend({
  class_id: z.number({ error: getRequiredFieldMessage("class_id") }),
  status: z.literal("active", { error: getRequiredFieldMessage("status") }),
  exited_at: z.null().optional(),
}) satisfies z.ZodType<ActiveStudent>;

const inactiveStudentSchema = studentBaseSchema.extend({
  class_id: z.null({ error: getRequiredFieldMessage("class_id") }),
  status: z.enum(["dropped", "transferred", "graduated"], {
    error: getRequiredFieldMessage("status"),
  }),
  exited_at: z.number({ error: getRequiredFieldMessage("exited_at") }),
}) satisfies z.ZodType<InactiveStudent>;

const studentSchema = z.discriminatedUnion("status", [
  activeStudentSchema,
  inactiveStudentSchema,
]) satisfies z.ZodType<Student>;

const newStudentSchema = activeStudentSchema.omit({
  id: true,
}) satisfies z.ZodType<NewStudent>;

const editStudentSchema = z.union([
  activeStudentSchema.partial().required({ id: true }),
  inactiveStudentSchema.partial().required({ id: true }),
]) satisfies z.ZodType<EditStudent>;

const batchEditStudentSchema = z.union([
  activeStudentSchema
    .partial()
    .omit({ id: true })
    .extend({ ids: z.array(z.number()) }),
  inactiveStudentSchema
    .partial()
    .omit({ id: true })
    .extend({ ids: z.array(z.number()) }),
]) satisfies z.ZodType<BatchEditStudent>;

const XLSXStudentSchema = studentBaseSchema.extend({
  birth_date: z.date(),
}) satisfies z.ZodType<XLSXStudent>;

const newXLSXStudentSchema = XLSXStudentSchema.omit({
  id: true,
}) satisfies z.ZodType<NewXLSXStudent>;

export const studentSchemas = {
  studentSchema,
  newStudentSchema,
  editStudentSchema,
  batchEditStudentSchema,
  newXLSXStudentSchema
};

// ========== Class schemas ==========

const classSchema = z.object({
  id: z.number({ error: getRequiredFieldMessage("id") }),
  grade: z
    .number({ error: getRequiredFieldMessage("grade") })
    .max(10, { message: "يرجى إدخال مستوى منطقي" }),
  school_level: z.literal(["primary", "middle", "high"], {
    error: getRequiredFieldMessage("school_level"),
  }),
  section: z.string({ error: getRequiredFieldMessage("section") }),
}) satisfies z.ZodType<Class>;

const newClassSchema = classSchema.omit({
  id: true,
}) satisfies z.ZodType<NewClass>;
const editClassSchema = classSchema
  .partial()
  .required({ id: true }) satisfies z.ZodType<EditClass>;

export const classSchemas = { classSchema, newClassSchema, editClassSchema };

// ========== Lateness schemas ==========
const latenessSchema = z.object({
  id: z.number({ error: getRequiredFieldMessage("id") }),
  student_id: z.number({ error: getRequiredFieldMessage("student_id") }),
  date: z.number({ error: getRequiredFieldMessage(" التاريخ") }),
  reason: z.string().min(5, { message: "يجب إدخال سبب الغياب" }),
  reason_accepted: z.literal([0, 1]),
  late_by: z.number({ error: getRequiredFieldMessage("مدة التأخر") }), // it will be used to insert the time of enter then transformed to minutes after shift start
  start_time: z.number({ error: getRequiredFieldMessage("وقت البدء") }),
}) satisfies z.ZodType<Lateness>;
const newLatenessSchema = latenessSchema.omit({
  id: true,
}) satisfies z.ZodType<NewLateness>;
const editLatenessSchema = latenessSchema
  .partial()
  .required({ id: true }) satisfies z.ZodType<EditLateness>;
const batchEditLatenessSchema = editLatenessSchema
  .omit({ id: true })
  .extend({ ids: z.array(z.number()) }) satisfies z.ZodType<BatchEditLateness>;

export const latenessSchemas = {
  latenessSchema,
  newLatenessSchema,
  editLatenessSchema,
  batchEditLatenessSchema,
};

// ========== absence schemas ==========
const absenceSchema = z.object({
  id: z.number({ error: getRequiredFieldMessage("id") }),
  student_id: z.number({ error: getRequiredFieldMessage("student_id") }),
  date: z.number({ error: getRequiredFieldMessage(" التاريخ") }),
  reason: z.string().min(5, { message: "يجب إدخال سبب الغياب" }),
  reason_accepted: z.literal([0, 1]),
  start_time: z.number({ error: getRequiredFieldMessage("وقت البدء") }),
}) satisfies z.ZodType<Absence>;
const newAbsenceSchema = absenceSchema.omit({
  id: true,
}) satisfies z.ZodType<NewAbsence>;
const editAbsenceSchema = absenceSchema
  .partial()
  .required({ id: true }) satisfies z.ZodType<EditStudent>;
const batchEditAbsenceSchema = editAbsenceSchema
  .omit({ id: true })
  .extend({ ids: z.array(z.number()) }) satisfies z.ZodType<BatchEditAbsence>;

export const absenceSchemas = {
  absenceSchema,
  newAbsenceSchema,
  editAbsenceSchema,
  batchEditAbsenceSchema,
};

// ========== Season schemas ==========
const schoolSeasonSchema = z.object({
  id: z.number({ error: getRequiredFieldMessage("id") }),
  name: z
    .string({
      error: getRequiredFieldMessage("اسم السنة الدراسية"),
    })
    .min(4, "اسم السنة الدراسية يجب أن يكون على الأقل 4 أحرف"),

  terms: z
    .array(
      z.object({
        name: z
          .string({
            error: getRequiredFieldMessage("اسم الفصل"),
          })
          .min(4, "اسم الفصل يجب أن يكون على الأقل 4 أحرف"),
        startDate: z.preprocess(
          (val) => toTimestamp(val),
          z.number({
            error: getRequiredFieldMessage("تاريخ البداية"),
          }),
        ),
        endDate: z.preprocess(
          (val) => toTimestamp(val),
          z.number({
            error: getRequiredFieldMessage("تاريخ النهاية"),
          }),
        ),
      }),
    )
    .min(1, "يجب أن تحتوي السنة الدراسية على فصل دراسي على الأقل")
    .refine((terms) => !hasCollapsingTerms(terms), {
      message: "يجب ألا تتداخل الفصول الدراسية مع بعضها",
    })
    .superRefine((terms, ctx) => {
      terms.forEach((term, index) => {
        const start = term.startDate;
        const end = term.endDate;

        if (end <= start) {
          ctx.addIssue({
            code: "custom",
            path: [index, "endDate"],
            message: `تاريخ نهاية الفصل الدراسي (${term.name}) يجب أن يكون بعد تاريخ البداية`,
          });
        }

        if (end - start < 259200000) {
          ctx.addIssue({
            code: "custom",
            path: [index, "endDate"],
            message: `مدة الفصل الدراسي (${term.name}) لا تقل عن ثلاثة أيام`,
          });
        }
      });
    }),
}) satisfies z.ZodType<SchoolSeason>;
const newSeasonSchema = schoolSeasonSchema.omit({
  id: true,
}) satisfies z.ZodType<NewSchoolSeason>;
const editSeasonSchema = schoolSeasonSchema
  .partial()
  .required({ id: true }) satisfies z.ZodType<EditSchoolSeason>;
const NewSeasonPayloadSchema = z.object({
  terminateCurrentSeason: z.boolean(),
  newSeason: newSeasonSchema,
  classPromotionMap: z.record(z.string().regex(/^\d+$/), z.number(), {
    error: "توجد مشكلة في نقل الأقسام إلى المستويات القادمة",
  }),
  repeaters: z.array(z.number(), { error: "توجد مشكلة في قائمة المعيدين" }),
}) satisfies z.ZodType<NewSeasonPayload>;

export const seasonSchemas = {
  editSeasonSchema,
  NewSeasonPayloadSchema,
  newSeasonSchema,
};

// ========== Other schemas (to be used across DELETE endpoints)==========
export const DeleteBodySchema = z.array(z.number().int().positive()).min(1);
