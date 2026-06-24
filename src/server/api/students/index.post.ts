import { EditStudent, BatchEditStudent, NewStudent, BackendValidationError } from "~/data/types";
import { studentService } from "~/server/services/studentService";
import type { H3Error } from "h3";
import { ZodError } from "zod";
import { studentSchemas } from "~/models/zod schemas";

import { z } from "zod";
type Operation = "create" | "batch create" | "update" | "batch update by ids" | "batch update by payload";

const isStudentCreateArray = (
  body: unknown
): body is NewStudent[] =>
  Array.isArray(body) &&
  body.every(item => item && typeof item === "object" && !("id" in item));

const isStudentUpdateArray = (
  body: unknown
): body is EditStudent[] =>
  Array.isArray(body) &&
  body.every(item => item && typeof item === "object" && "id" in item);


export default defineEventHandler(async (event) => {
  const reqBody = await readBody<NewStudent | NewStudent[] | EditStudent | EditStudent[] | BatchEditStudent>(
    event
  );

  let operation: Operation = isStudentCreateArray(reqBody) ? "batch create" : Array.isArray(reqBody) ? "batch update by payload" : "ids" in reqBody ? "batch update by ids" :
    !("id" in reqBody) ? "create" : "update";


  const schemaMap: Record<Operation, z.ZodTypeAny> = {
    create: studentSchemas.newStudentSchema,
    "batch create": z.array(studentSchemas.newStudentSchema) satisfies z.ZodType<NewStudent[]>,
    update: studentSchemas.editStudentSchema,
    "batch update by payload": z.array(studentSchemas.editStudentSchema) satisfies z.ZodType<EditStudent[]>,
    'batch update by ids': studentSchemas.batchEditStudentSchema,
  };

  try {
    schemaMap[operation].parse(reqBody);
    if (isStudentCreateArray(reqBody)) {
      return studentService.createStudents(reqBody);
    }

    if (isStudentUpdateArray(reqBody) || ("ids" in reqBody)) {
      return studentService.updateStudents(reqBody);
    }
    // if no id : Create a new item
    else if (!("id" in reqBody)) {
      return studentService.createStudent(reqBody);
    }
    // if id : item exists So update it
    else {
      return studentService.updateStudent(reqBody);
    }
  }
  catch (error) {
    // 1. validation error branch
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        message: 'مشكلة في البيانات المرسلة',
        statusMessage: "failed validation",
        data: {
          issues: error.issues
        }
      } as BackendValidationError)

    }
    // 2. Business / Database error branch 
    logError("Error updating student:", error, event.path, reqBody);

    const errorMessageTitle = operation === "create" ? " إنشاء الطالب" : operation === "update" ? " تحديث معلومات الطالب" : "تعديل الطلاب المحددين";
    const errorMessage = (error as H3Error)?.message ?? "حدث خطأ أثناء " + errorMessageTitle
    throw createError(toSafeError(error, "حدث خطأ أثناء " + errorMessage));
  }
});
