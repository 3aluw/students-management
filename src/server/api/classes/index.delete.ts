import { classService } from "~/server/services/classService";
import useDBUtils from "~/composables/useDBUtils";
const { logError,toSafeError } = useDBUtils();

export default defineEventHandler((event) => {
  const query = getQuery<{ id: string }>(event);
  if (!query.id) {
    throw createError({
      statusCode: 400,
      statusMessage: "لم يتم تحديد القسم المراد حذفه",
    });
  }
  try {
    return classService.deleteClass(query.id);

  } catch (error) {
    logError("Error deleting class:", error, event.path, query.id);
     const safeError = createError(toSafeError(error, "حدث خطأ أثناء حذف القسم"));
    return sendError(event, safeError);
  }
})
