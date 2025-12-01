import { EditAbsence, BatchEditAbsence, NewAbsence } from "~/data/types";
import db from "~/db/db";
import useDBUtils from "../../../composables/useDBUtils";

export default defineEventHandler(async (event) => {
  const { generateDBSetClause, generateDBInClause } = useDBUtils();

  const reqBody = await readBody<NewAbsence | EditAbsence | BatchEditAbsence>( event );
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

  const { student_id, date, reason, reason_accepted } = reqBody;
  // if no id : Create a new item
  if (!("id" in reqBody)) {
    try {
      const stmt = db.prepare(
        "INSERT INTO student (class_id, first_name, last_name, father_name,grandfather_name, sex, phone_number, birth_date, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      );
      const info = stmt.run(
        class_id,
        first_name,
        last_name,
        father_name,
        grandfather_name,
        sex,
        phone_number,
        birth_date,
        address
      );
      return { success: true, id: info.lastInsertRowid, info };
    } catch (err) {
      throw createError({
        statusCode: 400,
        statusMessage: (err as Error).message || "لم تتم إضافة الطالب",
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
