import type { EditClass, NewClass } from "~/data/types";
import useDBUtils from "~/composables/useDBUtils";
import { classService } from "~/server/services/classService";
import type { H3Error } from "h3";
import useZodSchema from "~/composables/useZodSchema";
import { z } from "zod";
type Operation = "create" | "update";

export default defineEventHandler(async (event) => {
const { logError, toSafeError } = useDBUtils();
  const { classSchemas } = useZodSchema()

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
    logError("Error fetching classes:", error, event.path, undefined);

    const reqMode = "id" in reqBody ? 'edit' : 'create'
    const errorMessageTitle = reqMode === 'edit' ? "تعديل القسم" : " إضافة القسم"
    const errorMessage = (error as H3Error)?.message ?? "حدث خطأ أثناء " + errorMessageTitle
    throw createError(toSafeError(error, errorMessage));

  }
});
