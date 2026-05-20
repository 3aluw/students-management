import db from '~/db/db';
import type { EventQueryFilters, LocalAbsence } from "~/data/types";
import useDBUtils from '~/composables/useDBUtils';
type TotalRow = { total: number };

const { buildWhereQuery } = useDBUtils();

export const absenceRepo = {
    getAbsences: (filters: EventQueryFilters) => {
        const { limit = 20, offset = 0 } = filters;
        const { where, params } = buildWhereQuery(filters, "absence");

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
        const absences = stmt.all() as LocalAbsence[];

        const stmtTotal = db
            .prepare(
                `SELECT COALESCE(COUNT(*), 0) AS total
    FROM absence a
    INNER JOIN student s ON s.id = a.student_id
    INNER JOIN class c ON c.id = s.class_id
    ${where ? where : ""}
    ORDER BY a.date DESC`
            )
            .bind(...params);
        const total = (stmtTotal.get() as TotalRow).total;

        return { total, absences };
    },

    deleteAbsences: (absenceIds: number[]) => {
        const { generateDBInClause } = useDBUtils();
        const inClause = generateDBInClause(absenceIds.length);
        const stmt = db.prepare(`DELETE FROM absence WHERE id IN (${inClause})`);
        return stmt.run(absenceIds);
    }
}