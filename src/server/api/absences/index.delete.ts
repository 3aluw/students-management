
import { absenceService } from "~/server/services/absenceService";
import useDBUtils from "~/composables/useDBUtils";
const { logError, toSafeError } = useDBUtils();
import { z, ZodError } from "zod";

const schema = z.array(z.number().int().positive()).min(1);

export default defineEventHandler(async (event) => {
  const absenceIds = await readBody<number[]>(event);
  /* Validation */
  const result = schema.safeParse(absenceIds);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "failed validation",
      message: "تم استلام بيانات غير صالحة",
    });
  }

  try {
    return absenceService.deleteAbsences(absenceIds);
  }
  catch (err) {
    logError("Error deleting absences:", err, event.path, absenceIds);
    throw createError(toSafeError(err, "فشلت عملية حذف الغيابات"));

  }
});
