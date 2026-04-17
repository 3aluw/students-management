import { studentService } from "~/server/services/studentService";
import type { H3Error } from "h3";
export default defineEventHandler((event) => {
  const { classId, name } = getQuery<{ classId?: string; name?: string }>(
    event,
  );
  try {
    return studentService.getStudents({ classId, name });
  } catch (err) {
    const error = err as Partial<H3Error>;
    return sendError(
      event,
      createError({
        statusCode: error?.statusCode || 500,
        statusMessage:
          error?.statusMessage ||
          error?.message ||
          "فشلت عملية البحث عن الطلبة",
      }),
    );
  }
});
