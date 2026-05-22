import { BatchEditLateness, EditLateness, NewLateness } from "~/data/types";
import useDBUtils from "~/composables/useDBUtils";
const { logError, toSafeError } = useDBUtils();
import { latenessService } from "~/server/services/latenessService";
import type { H3Error } from "h3";


export default defineEventHandler(async (event) => {
  const { generateDBSetClause, generateDBInClause } = useDBUtils();

  const reqBody = await readBody<
    NewLateness[] | EditLateness | BatchEditLateness
  >(event);
  try {
    // Batch Edit Absences
    if ("ids" in reqBody) {
      return latenessService.batchEditLateness(reqBody);
    }
    // if no id : It is an array of new absences to insert db
    if (!("id" in reqBody)) {
      return latenessService.createLateness(reqBody);
    } // if id : item exists So update it
    else {
      return latenessService.editLateness(reqBody);
    }
  } catch (err) {
    logError("Error fetching lateness:", err, event.path, reqBody);

    const reqMode = "ids" in reqBody ? "batch update" : !("id" in reqBody) ? "create" : "update";
    const errorMessageTitle = reqMode === "create" ? " إنشاء التأخر" : reqMode === "update" ? " تحديث معلومات التأخر" : "تعديل التأخرات المحددة";
    const errorMessage = (err as H3Error)?.statusMessage ?? "حدث خطأ أثناء " + errorMessageTitle
    const safeError = createError(toSafeError(err, errorMessage));
    return sendError(
      event, safeError
    );
  }
});
