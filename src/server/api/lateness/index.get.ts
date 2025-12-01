import db from "~/db/db";
import type { EventQueryFilters, LocalLateness } from "~/data/types";
import useDBUtils from "~/composables/useDBUtils";

type TotalRow = { total: number };

export default defineEventHandler(async (event) => {
  const { buildWhereQuery } = useDBUtils();

  const query = getQuery<EventQueryFilters>(event); // time filter / class filter / offset
  const { limit = 20, offset = 0 } = query;
  const { where, params } = buildWhereQuery(query, "absence");

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
    l.*
    FROM lateness l
    INNER JOIN student s ON s.id = l.student_id
    INNER JOIN class c ON c.id = s.class_id
    ${where ? where : ""}
    ORDER BY l.date DESC
    LIMIT ? OFFSET ?
`
    )
    .bind(...params, Number(limit), Number(offset));
  const lateness = stmt.all() as LocalLateness[];

  const stmtTotal = db
    .prepare(
      `SELECT COALESCE(COUNT(*), 0) AS total
    FROM lateness l
    INNER JOIN student s ON s.id = l.student_id
    INNER JOIN class c ON c.id = s.class_id
    ${where ? where : ""}
    ORDER BY l.date DESC`
    )
    .bind(...params);
  const total = (stmtTotal.get() as TotalRow).total;
  return { total, lateness };
});
