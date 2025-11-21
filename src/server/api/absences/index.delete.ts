import useDBUtils from "~/composables/useDBUtils";

import db from "~/db/db";

export default defineEventHandler(async (event) => {
  const absenceIds = await readBody<number[]>(event);
  const { generateDBInClause } = useDBUtils();
  const inClause = generateDBInClause(absenceIds.length);
  const stmt = db.prepare(`DELETE FROM absence WHERE id IN (${inClause})`);
  const result = stmt.run(absenceIds);
  if (result.changes > 0) {
    return { status: 200, message: "تم حذف الغيابات" };
  } else {
    return { status: 404, message: "لم يتم إيجاد الغيابات" };
  }
});
