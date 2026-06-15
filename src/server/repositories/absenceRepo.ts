import db from '~/db/db';
import type { BatchEditAbsence, EditAbsence, EventQueryFilters, LocalAbsence, NewAbsence } from "~/data/types";
type TotalRow = { total: number };


export const absenceRepo = {
    getAbsences: (filters: EventQueryFilters) => {
        const { limit , offset , ...otherFilters } = filters;
        const { stmt: whereStmt, bindings: whereBindings } = buildSQLClause("absence", otherFilters)
        const { stmt: paginationStmt, bindings: paginationBindings } = buildSQLClause("pagination", { limit, offset })

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
    ${whereStmt}
    ORDER BY a.date DESC
    ${paginationStmt}
`
            )
            .bind(...whereBindings, ...paginationBindings);
        const absences = stmt.all() as LocalAbsence[];

        const stmtTotal = db
            .prepare(
                `SELECT COALESCE(COUNT(*), 0) AS total
    FROM absence a
    INNER JOIN student s ON s.id = a.student_id
    INNER JOIN class c ON c.id = s.class_id
    ${whereStmt}
    ORDER BY a.date DESC`
            )
            .bind(...whereBindings);
        const total = (stmtTotal.get() as TotalRow).total;

        return { total, absences };
    },

    deleteAbsences: (absenceIds: number[]) => {

        const inClause = generateDBInClause(absenceIds.length);
        const stmt = db.prepare(`DELETE FROM absence WHERE id IN (${inClause})`);
        return stmt.run(absenceIds);
    },

    createAbsences: (absences: NewAbsence[]) => {
        const stmt = db.prepare(`
        INSERT OR IGNORE INTO absence
        (student_id, date, start_time, reason, reason_accepted)
        VALUES (?, ?, ?, ?, ?)
`);

        const insertMany = db.transaction((absenceArray: NewAbsence[]) => {
            let total = 0;

            for (const a of absenceArray) {
                const result = stmt.run(
                    a.student_id,
                    a.date,
                    a.start_time,
                    a.reason,
                    a.reason_accepted
                );

                total += result.changes;
            }
            return { changes: total };
        })
        return insertMany(absences);
    },

    editAbsence: (absence: EditAbsence) => {
        const values = Object.values(absence);
        const setClause = generateDBSetClause(absence);
        const stmt = db.prepare(`UPDATE absence SET ${setClause} WHERE id = ?`);
        return stmt.run(...values, absence.id);
    },

    editAbsences: (abcenses: BatchEditAbsence) => {
        const { ids, ...props } = abcenses;
        const values = Object.values(props);
        const inClause = generateDBInClause(ids.length);
        const setClause = generateDBSetClause(props);
        const stmt = db.prepare(
            `UPDATE absence SET ${setClause} WHERE id IN (${inClause}) `
        );
        return stmt.run(...values, ...ids);
    },
}