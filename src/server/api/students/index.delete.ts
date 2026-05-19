import { Student } from "~/data/types";
import { studentService } from "~/server/services/studentService";
import type { H3Error } from "h3";
import useDBUtils from "~/composables/useDBUtils";
const { logError } = useDBUtils();

export default defineEventHandler(async (event) => {
  const studentsIds = await readBody<Student["id"][]>(event);
  try{
  return studentService.deleteStudents(studentsIds);
  } catch (error) {
      logError("Error deleting students:", error, event.path, studentsIds);
    return sendError(event, error as H3Error);
  }
});
