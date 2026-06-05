import { BackendValidationError, BatchEditLateness, EditLateness, NewLateness } from "~/data/types";

import { latenessService } from "~/server/services/latenessService";
import type { H3Error } from "h3";
import { ZodError } from "zod";
import { latenessSchemas } from "~/utils/zod-schemas";

import { z } from "zod";
type Operation = "create" | "update" | "batch update";

export default defineEventHandler(async (event) => {

  const reqBody = await readBody<
    NewLateness[] | EditLateness | BatchEditLateness
  >(event);

  let operation: Operation = "ids" in reqBody ? "batch update" :
    !("id" in reqBody) ? "create" : "update";


  const schemaMap: Record<Operation, z.ZodTypeAny> = {
    create: z.array(latenessSchemas.newLatenessSchema) satisfies z.ZodType<NewLateness[]>,
    update: latenessSchemas.editLatenessSchema,
    'batch update': latenessSchemas.batchEditLatenessSchema,
  };
  try {
    schemaMap[operation].parse(reqBody);
    // Batch Edit lateness
    if ("ids" in reqBody) {
      return latenessService.batchEditLateness(reqBody);
    }
    // if no id : It is an array of new lateness to insert db
    if (!("id" in reqBody)) {
      return latenessService.createLateness(reqBody);
    } // if id : item exists So update it
    else {
      return latenessService.editLateness(reqBody);
    }
  } catch (error) {
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
    logError("Error fetching lateness:", error, event.path, reqBody);

    const errorMessageTitle = operation === "create" ? " إنشاء التأخر" : operation === "update" ? " تحديث معلومات التأخر" : "تعديل التأخرات المحددة";
    const errorMessage = (error as H3Error)?.message ?? "حدث خطأ أثناء " + errorMessageTitle
    throw createError(toSafeError(error, errorMessage));

  }
});
