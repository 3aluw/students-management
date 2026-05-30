
import type { EditSchoolSeason, NewSeasonPayload } from "~/data/types";
import { seasonService } from "~/server/services/seasonService";
import useDBUtils from "~/composables/useDBUtils";
import type { H3Error } from "h3";

export default defineEventHandler(async (event) => {
const { logError, toSafeError } = useDBUtils();

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

    const errorMessageTitle = "id" in reqBody  ? " تحديث الموسم " : 'إنشاء الموسم الجديد'
    const errorMessage = (error as H3Error)?.message ?? "حدث خطأ أثناء " + errorMessageTitle

    throw createError(toSafeError(error, "حدث خطأ أثناء " + errorMessage));
  }

});
