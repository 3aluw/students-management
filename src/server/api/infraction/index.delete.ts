import { infractionService } from "~/server/services/infractionService";
import { z } from "zod";

const schema = z.array(z.number().int().positive()).min(1);

export default defineEventHandler(async (event) => {
  const infractionsIds = await readBody<number[]>(event);

  /* Validation */
  const result = schema.safeParse(infractionsIds);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "failed validation",
      message: "تم استلام بيانات غير صالحة",
    });
  }
  try {
    return infractionService.deleteInfractions(infractionsIds);
  }
  catch (err) {
    logError("Error deleting lateness:", err, event.path, infractionsIds);
    throw createError(toSafeError(err, "فشلت عملية حذف التأخرات"));

  }
});
