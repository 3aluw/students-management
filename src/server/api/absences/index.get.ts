import db from "~/db/db";
import type { EventQueryFilters, LocalAbsence } from "~/data/types";
import useDBUtils from "~/composables/useDBUtils";

export default defineEventHandler(async (event) => {
  const { buildWhereQuery } = useDBUtils();

  const query = getQuery<EventQueryFilters>(event); // time filter / class filter / offset
  const { limit = 20, offset = 0 } = query;
  const { where, params } = buildWhereQuery(query, "absence");
  console.log(query, where, params);

  const stmt = db
    .prepare(
      `
    SELECT
    s.first_name,
    s.last_name,
    s.class_id,
    c.grade,
    c.school_level,
    c.section,
    a.*
    FROM absence a
    INNER JOIN student s ON s.id = a.student_id
    INNER JOIN class c ON c.id = s.class_id
    ${where ? where : ""}
    ORDER BY a.date DESC
    LIMIT ? OFFSET ?
`
    )
    .bind(...params, limit, offset);
    console.log(stmt);
  const absences = stmt.all();
  return absences as LocalAbsence[];
});
