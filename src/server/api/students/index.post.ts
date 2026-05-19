import { EditStudent, BatchEditStudent, NewStudent } from "~/data/types";
import useDBUtils from "~/composables/useDBUtils";
import { studentService } from "~/server/services/studentService";

export default defineEventHandler(async (event) => {
  const {  toSafeError, logError } = useDBUtils();

  const reqBody = await readBody<NewStudent | EditStudent | BatchEditStudent>(
    event
  );
  try {
    if ("ids" in reqBody) {
      return studentService.updateStudents(reqBody);
    }
    // if no id : Create a new item
    if (!("id" in reqBody)) {
      return studentService.createStudent(reqBody);

    }
    // if id : item exists So update it
    else {
      return studentService.updateStudent(reqBody);
    }
  }
  catch (error) {
    logError("Error updating student:", error, event.path, reqBody);

    const reqMode = "ids" in reqBody ? "batch update" : !("id" in reqBody) ? "create" : "update";
    const errorMessage = reqMode === "create" ? " إنشاء الطالب" : reqMode === "update" ? " تحديث معلومات الطالب" : "تعديل الطلاب المحددين";
    const safeError = createError(toSafeError(error, "حدث خطأ أثناء " + errorMessage));
    return sendError(event, safeError);
  }

});
