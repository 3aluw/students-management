import { latenessService } from "~/server/services/latenessService";
import useDBUtils from "~/composables/useDBUtils";
const { logError, toSafeError } = useDBUtils();

export default defineEventHandler(async (event) => {
  const latenessIds = await readBody<number[]>(event);
  try {
    return latenessService.deleteLateness(latenessIds);
  }
  catch (err) {
    logError("Error deleting lateness:", err, event.path, latenessIds);
    const safeError = createError(toSafeError(err, "فشلت عملية حذف التأخرات"));
    return sendError(
      event, safeError
    );
  }
});
