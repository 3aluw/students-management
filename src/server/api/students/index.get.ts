import { studentService } from "~/server/services/studentService";
import useDBUtils from "~/composables/useDBUtils";
const { logError, toSafeError } = useDBUtils();
export default defineEventHandler((event) => {
  const { classId, name } = getQuery<{ classId?: string; name?: string }>(
    event,
  );
  try {
    return studentService.getStudents({ classId, name });
  } catch (err) {
    logError("Error fetching students:", err, event.path, { classId, name });
    const safeError = createError(toSafeError(err, "فشلت عملية البحث عن الطلبة"));
    return sendError(
      event, safeError
    );
  }
});
