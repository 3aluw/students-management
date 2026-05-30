import { latenessService } from "~/server/services/latenessService";
import useDBUtils from "~/composables/useDBUtils";
import { z } from "zod";

const schema = z.array(z.number().int().positive()).min(1);

export default defineEventHandler(async (event) => {
  const { logError, toSafeError } = useDBUtils();
  const latenessIds = await readBody<number[]>(event);

  /* Validation */
  const result = schema.safeParse(latenessIds);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "failed validation",
      message: "تم استلام بيانات غير صالحة",
    });
  }
  try {
    return latenessService.deleteLateness(latenessIds);
  }
  catch (err) {
    logError("Error deleting lateness:", err, event.path, latenessIds);
    throw createError(toSafeError(err, "فشلت عملية حذف التأخرات"));

  }
});
