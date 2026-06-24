import { EditAbsence, BatchEditAbsence, NewAbsence, BackendValidationError } from "~/data/types";
import { absenceService } from "~/server/services/absenceService";
import type { H3Error } from "h3";
import { absenceSchemas } from "~/models/zod schemas";
import { z, ZodError } from "zod";
type Operation = "create" | "update" | "batch update";


export default defineEventHandler(async (event) => {

  const reqBody = await readBody<NewAbsence[] | EditAbsence | BatchEditAbsence>(
    event
  );

  let operation: Operation = "ids" in reqBody ? "batch update" :
    !("id" in reqBody) ? "create" : "update";

  const schemaMap: Record<Operation, z.ZodTypeAny> = {
    create: z.array(absenceSchemas.newAbsenceSchema) satisfies z.ZodType<NewAbsence[]>,
    update: absenceSchemas.editAbsenceSchema,
    'batch update': absenceSchemas.batchEditAbsenceSchema,
  };

  try {
    // validation
    schemaMap[operation].parse(reqBody);
    // Batch Edit Absences
    if ("ids" in reqBody) {
      return absenceService.editAbsences(reqBody);
    }
    // if no id : It is an array of new absences to insert db
    if (!("id" in reqBody)) {
      return absenceService.createAbsences(reqBody);
    } // if id : item exists So update it
    else {
      return absenceService.editAbsence(reqBody);
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
    logError("Error fetching absences:", error, event.path, reqBody);

    const errorMessageTitle = operation === "create" ? " إنشاء الغياب" : operation === "update" ? " تحديث معلومات الغياب" : "تعديل الغيابات المحددة";
    const errorMessage = (error as H3Error)?.message ?? "حدث خطأ أثناء " + errorMessageTitle
    throw createError(toSafeError(error, errorMessage));

  }
});
