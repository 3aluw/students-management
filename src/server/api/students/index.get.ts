import { studentService } from "~/server/services/studentService";
import useDBUtils from "~/composables/useDBUtils";
export default defineEventHandler((event) => {
const { logError, toSafeError } = useDBUtils();

  const { classId, name } = getQuery<{ classId?: string; name?: string }>(
    event,
  );
  try {
    return studentService.getStudents({ classId, name });
  } catch (err) {
    logError("Error fetching students:", err, event.path, { classId, name });
    throw createError(toSafeError(err, "فشلت عملية إيجاد الطلبة"));
  }
});
