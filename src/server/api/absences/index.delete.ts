
import { absenceService } from "~/server/services/absenceService";
import useDBUtils from "~/composables/useDBUtils";
const { logError, toSafeError } = useDBUtils();

export default defineEventHandler(async (event) => {
  const absenceIds = await readBody<number[]>(event);
  try {
    return absenceService.deleteAbsences(absenceIds);
  }
  catch (err) {
    logError("Error deleting absences:", err, event.path, absenceIds);
    throw createError(toSafeError(err, "فشلت عملية حذف الغيابات"));

  }
});
