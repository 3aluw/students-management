import db from "~/db/db";
import type {
  BatchEditInfraction,
  EditInfraction,
  EventQueryFilters,
  LocalInfraction,
  NewInfraction,
} from "~/models/types";

type TotalRow = { total: number };

export const infractionRepo = {
  getInfractions: (filters: EventQueryFilters) => {
    const { limit, offset, ...otherFilters } = filters;
    const { stmt: whereStmt, bindings: whereBindings } = buildSQLClause(
      "infraction",
      otherFilters,
    );
    const { stmt: paginationStmt, bindings: paginationBindings } =
      buildSQLClause("pagination", { limit, offset });

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
    i.*
    FROM infraction i
    INNER JOIN student s ON s.id = i.student_id
    INNER JOIN class c ON c.id = s.class_id
    ${whereStmt}
    ORDER BY i.date DESC
   ${paginationStmt}
    
`,
      )
      .bind(...whereBindings, ...paginationBindings);
    const infractions = stmt.all() as LocalInfraction[];

    const stmtTotal = db
      .prepare(
        `
      SELECT COALESCE(COUNT(*), 0) AS total
    FROM infraction i
    INNER JOIN student s ON s.id = i.student_id
    INNER JOIN class c ON c.id = s.class_id
    ${whereStmt}
    ORDER BY i.date DESC`,
      )
      .bind(...whereBindings);
    const total = (stmtTotal.get() as TotalRow).total;

    return { total, infractions };
  },

  deleteInfractions: (infractionIds: number[]) => {
    const inClause = generateDBInClause(infractionIds.length);
    const stmt = db.prepare(`DELETE FROM infraction WHERE id IN (${inClause})`);
    return stmt.run(infractionIds);
  },

  createInfraction: (infractions: NewInfraction[]) => {
    const stmt = db.prepare(`
        INSERT OR IGNORE INTO infraction (student_id, date, start_time, minutes_after_start, reason, subject) 
        VALUES (?, ?, ?, ?, ?, ?)`);

    const insertMany = db.transaction((infractionsArray: NewInfraction[]) => {
      let total = 0;

      for (const i of infractionsArray) {
        const result = stmt.run(
          i.student_id,
          i.date,
          i.start_time,
          i.minutes_after_start,
          i.reason,
          i.subject,
        );
        total += result.changes;
      }
      return { changes: total };
    });
    return insertMany(infractions);
  },

  editInfraction: (infraction: EditInfraction) => {
    const values = Object.values(infraction);
    const setClause = generateDBSetClause(infraction);
    const stmt = db.prepare(`UPDATE infraction SET ${setClause} WHERE id = ?`);
    return stmt.run(...values, infraction.id);
  },

  batchEditInfraction: (infraction: BatchEditInfraction) => {
    const { ids, ...props } = infraction;
    const values = Object.values(props);
    const inClause = generateDBInClause(ids.length);
    const setClause = generateDBSetClause(props);
    const stmt = db.prepare(
      `UPDATE infraction SET ${setClause} WHERE id IN (${inClause}) `,
    );
    return stmt.run(...values, ...ids);
  },
};
