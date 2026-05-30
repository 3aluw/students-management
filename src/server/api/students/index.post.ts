import { EditStudent, BatchEditStudent, NewStudent, BackendValidationError } from "~/data/types";
import useDBUtils from "~/composables/useDBUtils";
import { studentService } from "~/server/services/studentService";
import type { H3Error } from "h3";
import { ZodError } from "zod";
import useZodSchema from "~/composables/useZodSchema";
import { z } from "zod";
type Operation = "create" | "update" | "batch update";

export default defineEventHandler(async (event) => {
  const { toSafeError, logError } = useDBUtils();
  const { studentSchemas } = useZodSchema()
  const reqBody = await readBody<NewStudent | EditStudent | BatchEditStudent>(
    event
  );

  let operation: Operation = "ids" in reqBody ? "batch update" :
    !("id" in reqBody) ? "create" : "update";


  const schemaMap: Record<Operation, z.ZodTypeAny> = {
    create: studentSchemas.newStudentSchema,
    update: studentSchemas.editStudentSchema,
    'batch update': studentSchemas.batchEditStudentSchema,
  };

  try {
    const parsed = schemaMap[operation].parse(reqBody);
    if ("ids" in reqBody) {
      return studentService.updateStudents(reqBody);
    }
    // if no id : Create a new item
    if (!("id" in reqBody)) {
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
        statusMessage: "failed validtion",
        data: {
          issues: error.issues
        }
      } as BackendValidationError)

    }

    logError("Error updating student:", error, event.path, reqBody);

    const errorMessageTitle = operation === "create" ? " إنشاء الطالب" : operation === "update" ? " تحديث معلومات الطالب" : "تعديل الطلاب المحددين";
    const errorMessage = (error as H3Error)?.message ?? "حدث خطأ أثناء " + errorMessageTitle
    throw createError(toSafeError(error, "حدث خطأ أثناء " + errorMessage));
  }
});
