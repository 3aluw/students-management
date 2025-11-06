import useDBUtils from "~/composables/useDBUtils";
import { Student } from "~/data/types";

import db from "~/db/db";

export default defineEventHandler(async (event) => {
  const studentsIds = await readBody<Student[]>(event);
  const { generateDBInClause } = useDBUtils();
  const inClause = generateDBInClause(studentsIds.length);
  const stmt = db.prepare(`DELETE FROM student WHERE id IN (${inClause})`);
  const result = stmt.run(studentsIds);
  if (result.changes > 0) {
    return { status: 200, message: "تم حذف القسم" };
  } else {
    return { status: 404, message: "لم يتم إيجاد القسم" };
  }
});
