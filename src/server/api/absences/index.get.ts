import db from "~/db/db";
import type { LocalAbsence } from "~/data/types";

export default defineEventHandler(async(event) => {
  //const body = await readBody(event) // time filter / class filter / offset 
  const stmt = db.prepare(`
    SELECT
    s.first_name,
    s.last_name,
    s.class_id,
    c.grade,
    c.school_level,
    c.section,
    a.*
FROM
    absence a
    INNER JOIN student s ON s.id = a.student_id
    INNER JOIN class c ON c.id = s.class_id
`);
  const absences = stmt.all();
  return absences as LocalAbsence[];
});
