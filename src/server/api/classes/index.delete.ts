import { classService } from "~/server/services/classService";
import type { H3Error } from "h3";
import useDBUtils from "~/composables/useDBUtils";
const { logError } = useDBUtils();

export default defineEventHandler((event) => {
  const query = getQuery<{ id: string }>(event);
  if (!query.id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Class ID is required",
    });
  }
  try {
    return classService.deleteClass(query.id);

  } catch (error) {
    logError("Error deleting class:", error, event.path, query.id);
    return sendError(event, error as H3Error);
  }
})
