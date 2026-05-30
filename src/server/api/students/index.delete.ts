import { BackendValidationError, Student } from "~/data/types";
import { studentService } from "~/server/services/studentService";
import useDBUtils from "~/composables/useDBUtils";
const { logError, toSafeError } = useDBUtils();
import { z, ZodError } from "zod";

const schema = z.array(z.number().int().positive()).min(1);

export default defineEventHandler(async (event) => {
  const studentsIds = await readBody<Student["id"][]>(event)
  
  /* Validation */
  const result = schema.safeParse(studentsIds);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "failed validation",
      message: "تم استلام بيانات غير صالحة",
    });
  }

  try {
    return studentService.deleteStudents(studentsIds);
  }
  catch (error) {

    logError("Error deleting students:", error, event.path, studentsIds);
    throw createError(toSafeError(error, "حدث خطأ أثناء حذف الطلاب المحددين"));

  }
});
