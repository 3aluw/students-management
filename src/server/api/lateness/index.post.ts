import { BatchEditLateness, EditLateness, NewLateness } from "~/data/types";
import db from "~/db/db";
import useDBUtils from "../../../composables/useDBUtils";

export default defineEventHandler(async (event) => {
  const { generateDBSetClause, generateDBInClause } = useDBUtils();

  const reqBody = await readBody<
    NewLateness[] | EditLateness | BatchEditLateness
  >(event);
  // Batch Edit Absences
  if ("ids" in reqBody) {
    try {
      const { ids, ...props } = reqBody;
      const values = Object.values(props);
      const inClause = generateDBInClause(ids.length);
      const setClause = generateDBSetClause(props);
      const stmt = db.prepare(
        `UPDATE lateness SET ${setClause} WHERE id IN (${inClause}) `
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

  // if no id : Create a new item
  if (!("id" in reqBody)) {
    try {
      const stmt = db.prepare(
        "INSERT OR IGNORE INTO lateness (student_id, date, start_time, late_by, reason, reason_accepted) VALUES (?, ?, ?, ?, ?, ?)"
      );
      const insertMany = db.transaction((latenessArray: NewLateness[]) => {
        let insertedCount = 0;
        let skippedIds : number[] = [];

        for (const l of latenessArray) {
          const info = stmt.run(
            l.student_id,
            l.date,
            l.start_time,
            l.late_by,
            l.reason,
            l.reason_accepted
          );

          if (info.changes === 0) skippedIds.push(l.student_id);
          else insertedCount++;
        }
      if( insertedCount == 0 ) throw new Error('لم يتم تسجيل أي تأخر')
        return { insertedCount, skippedIds };
      });

      const result = insertMany(reqBody);
      return { success: true, ...result };
    } catch (err) {
      throw createError({
        statusCode: 400,
        statusMessage: (err as Error).message || "لم تتم إضافة أي تأخر",
      });
    }
  } // if id : item exists So update it
  else {
    try {
      const values = Object.values(reqBody);

      const setClause = generateDBSetClause(reqBody);
      const stmt = db.prepare(`UPDATE lateness SET ${setClause} WHERE id = ?`);
      const info = stmt.run(...values, reqBody.id);
      return { success: true, id: info.lastInsertRowid, info };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
});

/*START HERE

const insertMany = db.transaction((latenessArray) => {
  const inserted = [];
  const skipped = [];

  for (const lateness of latenessArray) {
    const { student_id, date, start_time, late_by, reason, reason_accepted } = lateness;

    const info = stmt.run(student_id, date, start_time, late_by, reason, reason_accepted);

    if (info.changes === 0) {
      // Row was skipped (duplicate)
      skipped.push(lateness);
    } else {
      // Row was inserted
      inserted.push(lateness);
    }
  }

  return { inserted, skipped };
});
 */
