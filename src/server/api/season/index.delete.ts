import { seasonService } from "~/server/services/seasonService";
import useDBUtils from "~/composables/useDBUtils";

export default defineEventHandler((event) => {
const { logError, toSafeError } = useDBUtils();
  const query = getQuery<{ id: string }>(event);
  if (!query.id) {
    throw createError({
      statusCode: 400,
      message: "لم يتم تحديد الموسم المراد حذفه",
    });
  }
  const seasonId = query.id;
  try {
    return seasonService.deleteSeason(Number(seasonId));

  } catch (error) {
    logError("Error deleting season:", error, event.path, seasonId);
    throw createError(toSafeError(error, "حدث خطأ أثناء حذف الموسم"));
    
  }
})
