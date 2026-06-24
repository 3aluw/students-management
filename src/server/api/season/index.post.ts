
import type { BackendValidationError, EditSchoolSeason, NewSeasonPayload } from "~/models/types";
import { seasonService } from "~/server/services/seasonService";
import type { H3Error } from "h3";
import { ZodError } from "zod";
import { seasonSchemas } from "~/models/zod schemas";

import { z } from "zod";
type Operation = "create" | "update";

export default defineEventHandler(async (event) => {

  const reqBody = await readBody<EditSchoolSeason | NewSeasonPayload>(event);

  let operation: Operation = !("id" in reqBody) ? "create" : "update";
  const schemaMap: Record<Operation, z.ZodTypeAny> = {
    create: seasonSchemas.NewSeasonPayloadSchema,
    update: seasonSchemas.editSeasonSchema,
  };

  try {
    schemaMap[operation].parse(reqBody);
    // if no id : Create a new item
    if (!("id" in reqBody)) {
      return seasonService.runNewSeasonWorkflow(reqBody);

    } // if id : item exists So update it
    else {
      return seasonService.editSeason(reqBody);
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

    const errorMessageTitle = "id" in reqBody ? " تحديث الموسم " : 'إنشاء الموسم الجديد'
    const errorMessage = (error as H3Error)?.message ?? "حدث خطأ أثناء " + errorMessageTitle

    throw createError(toSafeError(error, "حدث خطأ أثناء " + errorMessage));
  }

});
