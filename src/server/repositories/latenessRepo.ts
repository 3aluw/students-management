import db from '~/db/db';
import type {  BatchEditLateness,  EditLateness, EventQueryFilters,  LocalLateness,  NewLateness } from "~/data/types";
import useDBUtils from '~/composables/useDBUtils';

type TotalRow = { total: number };

const { buildWhereQuery, generateDBSetClause, generateDBInClause } = useDBUtils();

export const latenessRepo = {
    getLateness: (filters: EventQueryFilters) => {
        const { limit = 20, offset = 0 } = filters;
        const { where, params } = buildWhereQuery(filters, "lateness");

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
                `
      SELECT COALESCE(COUNT(*), 0) AS total
    FROM lateness l
    INNER JOIN student s ON s.id = l.student_id
    INNER JOIN class c ON c.id = s.class_id
    ${where ? where : ""}
    ORDER BY l.date DESC`
            )
            .bind(...params);
        const total = (stmtTotal.get() as TotalRow).total;

        return { total, lateness };
    },

    deleteLateness: (latenessIds: number[]) => {
        const inClause = generateDBInClause(latenessIds.length);
        const stmt = db.prepare(`DELETE FROM lateness WHERE id IN (${inClause})`);
        return stmt.run(latenessIds);
    },

    createLateness: (lateness: NewLateness[]) => {

        const stmt = db.prepare(`
        INSERT OR IGNORE INTO lateness (student_id, date, start_time, late_by, reason, reason_accepted) VALUES (?, ?, ?, ?, ?, ?)
`);

        const insertMany = db.transaction((latenessArray: NewLateness[]) => {

            for (const l of latenessArray) {
                stmt.run(
                    l.student_id,
                    l.date,
                    l.start_time,
                    l.late_by,
                    l.reason,
                    l.reason_accepted
                );
            }
            return (db.prepare("SELECT changes() as changes").get() as { changes: number });

        });
        return insertMany(lateness);
    },

    editLateness: (lateness: EditLateness) => {
        const values = Object.values(lateness);
        const setClause = generateDBSetClause(lateness);
        const stmt = db.prepare(`UPDATE lateness SET ${setClause} WHERE id = ?`);
        return stmt.run(...values, lateness.id);
    },

    batchEditLateness: (lateness: BatchEditLateness) => {
        const { ids, ...props } = lateness;
        const values = Object.values(props);
        const inClause = generateDBInClause(ids.length);
        const setClause = generateDBSetClause(props);
        const stmt = db.prepare(
            `UPDATE lateness SET ${setClause} WHERE id IN (${inClause}) `
        );
        return stmt.run(...values, ...ids);
    },
}