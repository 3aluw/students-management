import { studentService } from "~/server/services/studentService";
import type { StudentsQueryFilters } from "~/data/types"
export default defineEventHandler((event) => {


  const query = getQuery<StudentsQueryFilters | { ids: number[] }>(
    event,
  );
  try {
    if ('ids' in query) query.ids = query.ids.map(Number)
    return studentService.getStudents(query);
  } catch (err) {
    logError("Error fetching students:", err, event.path, query);
    throw createError(toSafeError(err, "فشلت عملية إيجاد الطلبة"));
  }
});
