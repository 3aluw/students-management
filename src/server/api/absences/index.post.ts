import { EditAbsence, BatchEditAbsence, NewAbsence } from "~/data/types";
import db from "~/db/db";
import useDBUtils from "../../../composables/useDBUtils";

export default defineEventHandler(async (event) => {
  const { generateDBSetClause, generateDBInClause } = useDBUtils();

  const reqBody = await readBody<NewAbsence[] | EditAbsence | BatchEditAbsence>(
    event
  );
  // Batch Edit Absences
  if ("ids" in reqBody) {
    try {
      const { ids, ...props } = reqBody;
      const values = Object.values(props);
      const inClause = generateDBInClause(ids.length);
      const setClause = generateDBSetClause(props);
      const stmt = db.prepare(
        `UPDATE absence SET ${setClause} WHERE id IN (${inClause}) `
      );
      const info = stmt.run(...values, ...ids);
      return { success: true, id: info.lastInsertRowid, info };
    } catch (err) {
      throw createError({
        statusCode: 400,
        statusMessage: (err as Error).message || "لم يتم تعديل معلومات الطلاب",
      });
    }
  }

  // if no id : It is an array of new absences to insert db
  if (!("id" in reqBody)) {
    try {
      const stmt = db.prepare(
        "INSERT INTO absence (student_id, date, reason, reason_accepted) VALUES (?, ?, ?, ?)"
      );
      const insertMany = db.transaction((absences) => {
        for (const absence of absences) {
          const { student_id, date, reason, reason_accepted } = absence;
          stmt.run(student_id, date, reason, reason_accepted);
        }
      });
      const info = insertMany(reqBody)
      return { success: true, };
    } catch (err) {
      throw createError({
        statusCode: 400,
        statusMessage: (err as Error).message || "لم تتم إضافة الغياب",
      });
    }
  } // if id : item exists So update it
  else {
    try {
      const values = Object.values(reqBody);

      const setClause = generateDBSetClause(reqBody);
      const stmt = db.prepare(`UPDATE absence SET ${setClause} WHERE id = ?`);
      const info = stmt.run(...values, reqBody.id);
      return { success: true, id: info.lastInsertRowid, info };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
});
