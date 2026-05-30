import { Student } from "~/data/types";
import { studentService } from "~/server/services/studentService";
import useDBUtils from "~/composables/useDBUtils";
const { logError, toSafeError } = useDBUtils();

export default defineEventHandler(async (event) => {
  const studentsIds = await readBody<Student["id"][]>(event);
  try{
  return studentService.deleteStudents(studentsIds);
  } catch (error) {
      logError("Error deleting students:", error, event.path, studentsIds);
    throw createError(toSafeError(error, "حدث خطأ أثناء حذف الطلاب المحددين"));
    
  }
});
