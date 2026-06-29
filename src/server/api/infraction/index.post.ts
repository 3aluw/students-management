import {
  BackendValidationError,
  BatchEditInfraction,
  EditInfraction,
  NewInfraction,
} from "~/models/types";

import { infractionService } from "~/server/services/infractionService";
import type { H3Error } from "h3";
import { ZodError } from "zod";
import { infractionSchemas } from "~/models/zod schemas";

import { z } from "zod";
type Operation = "create" | "update" | "batch update";

export default defineEventHandler(async (event) => {
  const reqBody = await readBody<
    NewInfraction[] | EditInfraction | BatchEditInfraction
  >(event);

  let operation: Operation =
    "ids" in reqBody
      ? "batch update"
      : !("id" in reqBody)
        ? "create"
        : "update";

  const schemaMap: Record<Operation, z.ZodTypeAny> = {
    create: z.array(infractionSchemas.newInfractionSchema) satisfies z.ZodType<
      NewInfraction[]
    >,
    update: infractionSchemas.editInfractionSchema,
    "batch update": infractionSchemas.batchEditInfractionSchema,
  };
  try {
    schemaMap[operation].parse(reqBody);
    // Batch Edit infraction
    if ("ids" in reqBody) {
      return infractionService.batchEditInfraction(reqBody);
    }
    // if no id : It is an array of new infraction to insert db
    if (!("id" in reqBody)) {
      return infractionService.createInfractions(reqBody);
    } // if id : item exists So update it
    else {
      return infractionService.editInfraction(reqBody);
    }
  } catch (error) {
    // 1. validation error branch
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        message: "مشكلة في البيانات المرسلة",
        statusMessage: "failed validation",
        data: {
          issues: error.issues,
        },
      } as BackendValidationError);
    }
    // 2. Business / Database error branch
    logError("Error fetching infraction:", error, event.path, reqBody);

    const errorMessageTitle =
      operation === "create"
        ? " إنشاء المخالفة"
        : operation === "update"
          ? " تحديث معلومات المخالفة"
          : "تعديل المخالفات المحددة";
    const errorMessage =
      (error as H3Error)?.message ?? "حدث خطأ أثناء " + errorMessageTitle;
    throw createError(toSafeError(error, errorMessage));
  }
});
