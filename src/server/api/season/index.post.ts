
import type { EditSchoolSeason, NewSeasonPayload } from "~/data/types";
import { seasonService } from "~/server/services/seasonService";
import useDBUtils from "~/composables/useDBUtils";

const { logError, toSafeError } = useDBUtils();
export default defineEventHandler(async (event) => {
  const { createGenericError, StepError } = useDBUtils();
  const reqBody = await readBody<EditSchoolSeason | NewSeasonPayload>(event);

  try {
    // if no id : Create a new item
    if (!("id" in reqBody)) {
      return seasonService.runNewSeasonWorkflow(reqBody);

    } // if id : item exists So update it
    else {
      return seasonService.editSeason(reqBody);
    }
  }
  catch (error) {
    logError("Error updating student:", error, event.path, reqBody);

    const errorMessage = "id" in reqBody  ? " تحديث الموسم " : 'إنشاء الموسم الجديد'
    const safeError = createError(toSafeError(error, "حدث خطأ أثناء " + errorMessage));
    return sendError(event, safeError);
  }

});
