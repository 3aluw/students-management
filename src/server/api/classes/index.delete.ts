import { classService } from "~/server/services/classService";
import useDBUtils from "~/composables/useDBUtils";
const { logError,toSafeError } = useDBUtils();

export default defineEventHandler((event) => {
  const query = getQuery<{ id: string }>(event);
  if (!query.id) {
    throw createError({
      statusCode: 400,
      message: "لم يتم تحديد القسم المراد حذفه",
    });
  }
  try {
    return classService.deleteClass(query.id);

  } catch (error) {
    logError("Error deleting class:", error, event.path, query.id);
     throw createError(toSafeError(error, "حدث خطأ أثناء حذف القسم"));
    
  }
})
