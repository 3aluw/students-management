import type { EditClass, NewClass } from "~/data/types";
import useDBUtils from "../../../composables/useDBUtils";
import { classService } from "~/server/services/classService";
import type { H3Error } from "h3";

const { logError, toSafeError } = useDBUtils();
export default defineEventHandler(async (event) => {

  const reqBody = await readBody<NewClass | EditClass>(event);

  try {
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
        const errorMessage = (error as H3Error)?.statusMessage ?? "حدث خطأ أثناء " + errorMessageTitle
    const safeError = createError(toSafeError(error, errorMessage));
    return sendError(event, safeError);
  }
});
