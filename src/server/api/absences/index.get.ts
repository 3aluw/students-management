import db from "~/db/db";
import type { EventQueryFilters, LocalAbsence } from "~/data/types";
import useDBUtils from "~/composables/useDBUtils";

type TotalRow = { total: number };

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
    .bind(...params, Number(limit), Number(offset));
  const absences = stmt.all()  as LocalAbsence[];

  const stmtTotal = db
    .prepare(
    `SELECT COUNT(*) OVER() AS total
    FROM absence a
    INNER JOIN student s ON s.id = a.student_id
    INNER JOIN class c ON c.id = s.class_id
    ${where ? where : ""}
    ORDER BY a.date DESC`
    )
    .bind(...params);
  const total = (stmtTotal.get() as TotalRow).total;
  
  return {total, absences};
});
