import type { BackendValidationError, EditClass, NewClass } from "~/models/types";
import { classService } from "~/server/services/classService";
import type { H3Error } from "h3";
import { classSchemas } from "~/models/zod schemas";

import { z, ZodError } from "zod";
type Operation = "create" | "update";

export default defineEventHandler(async (event) => {


  const reqBody = await readBody<NewClass | EditClass>(event);

  let operation: Operation = !("id" in reqBody) ? "create" : "update";

  const schemaMap: Record<Operation, z.ZodTypeAny> = {
    create: classSchemas.newClassSchema,
    update: classSchemas.editClassSchema,
  };

  try {
    schemaMap[operation].parse(reqBody);
    if ("id" in reqBody) {
      return classService.editClass(reqBody);
    }
    else {
      return classService.createClass(reqBody);
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
    logError("Error fetching classes:", error, event.path, undefined);

    const reqMode = "id" in reqBody ? 'edit' : 'create'
    const errorMessageTitle = reqMode === 'edit' ? "تعديل القسم" : " إضافة القسم"
    const errorMessage = (error as H3Error)?.message ?? "حدث خطأ أثناء " + errorMessageTitle
    throw createError(toSafeError(error, errorMessage));

  }
});
