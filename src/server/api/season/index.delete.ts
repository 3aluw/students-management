import { seasonService } from "~/server/services/seasonService";
import useDBUtils from "~/composables/useDBUtils";
const { logError, toSafeError } = useDBUtils();

export default defineEventHandler((event) => {
  const query = getQuery<{ id: string }>(event);
  if (!query.id) {
    throw createError({
      statusCode: 400,
      statusMessage: "لم يتم تحديد الموسم المراد حذفه",
    });
  }
  const seasonId = query.id;
  try {
    return seasonService.deleteSeason(Number(seasonId));

  } catch (error) {
    logError("Error deleting season:", error, event.path, seasonId);
    const safeError = createError(toSafeError(error, "حدث خطأ أثناء حذف الموسم"));
    return sendError(event, safeError);
  }
})
