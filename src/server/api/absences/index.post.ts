import { EditAbsence, BatchEditAbsence, NewAbsence } from "~/data/types";
import { absenceService } from "~/server/services/absenceService";
import useDBUtils from "~/composables/useDBUtils";
const { logError, toSafeError } = useDBUtils();
import type { H3Error } from "h3";
export default defineEventHandler(async (event) => {


  const reqBody = await readBody<NewAbsence[] | EditAbsence | BatchEditAbsence>(
    event
  );
  try {
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
  } catch (err) {
    logError("Error fetching absences:", err, event.path, reqBody);

    const reqMode = "ids" in reqBody ? "batch update" : !("id" in reqBody) ? "create" : "update";
    const errorMessageTitle = reqMode === "create" ? " إنشاء الغياب" : reqMode === "update" ? " تحديث معلومات الغياب" : "تعديل الغيابات المحددة";
    const errorMessage = (err as H3Error)?.message ?? "حدث خطأ أثناء " + errorMessageTitle
    const safeError = createError(toSafeError(err, errorMessage));
    return sendError(
      event, safeError
    );
  }
});
