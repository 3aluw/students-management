import type { EditClass, NewClass } from "~/data/types";
import useDBUtils from "../../../composables/useDBUtils";
import { classService } from "~/server/services/classService";

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
    const defMessage = reqMode === 'edit' ? "حدث خطأ أثناء تعديل القسم" : "حدث خطأ أثناء إضافة القسم"
    const safeError = createError(toSafeError(error, defMessage));
    return sendError(event, safeError);
  }
});
