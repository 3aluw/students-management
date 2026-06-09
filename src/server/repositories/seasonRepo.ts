import { EditSchoolSeason, NewSchoolSeason, SchoolSeason } from "~/data/types";
import db from "~/db/db";

type sqliteSchoolSeason = Omit<SchoolSeason, "terms"> & { terms: string };

export const seasonRepo = {
//gets season ordered DESC accroding to end date
  getSeasons() {
    const stmt = db.prepare(`WITH ranked_seasons AS (
    SELECT s.*,
           MAX(json_extract(t.value, '$.endDate')) AS latest_end
    FROM season s
    JOIN json_each(s.terms) AS t
    GROUP BY s.id
    )
    SELECT id, name, terms
    FROM ranked_seasons
    ORDER BY latest_end DESC`);
    const seasons = stmt.all() as (Omit<SchoolSeason, "terms"> & {
      terms: string;
    })[];

    const parsedSeasons: SchoolSeason[] = seasons.map((season) => ({
      ...season,
      terms: JSON.parse(season.terms) as SchoolSeason["terms"],
    }));
    return parsedSeasons as SchoolSeason[];;
  },

  editSeason(season: EditSchoolSeason) {
    /* stringify terms */
    const stringifiedTerms = JSON.stringify(season.terms);
    const updatedSeason = {
      ...season,
      terms: stringifiedTerms,
    };
    /* exclude id from editing values */
    const { id, ...rest } = updatedSeason;

    const values = Object.values(rest);
    const setClause = generateDBSetClause(rest);

    console.log("values:", values, "setClause:", setClause);
    const stmt = db.prepare(`UPDATE season SET ${setClause} WHERE id = ?`);
    const result = stmt.run(...values, id);
    return result
  },

  createSeason(season: NewSchoolSeason) {
    const stringifiedTerms = JSON.stringify(season.terms);
    const newSeason = {
      ...season,
      terms: stringifiedTerms,
    };
    const stmt = db.prepare(`INSERT INTO season (name, terms) VALUES (?, ?)`);
    const result = stmt.run(season.name, stringifiedTerms);
    return result

  },
  deleteSeasons(id: number) {
    const stmt = db.prepare(`
    DELETE FROM season WHERE id = ?
    `);
    const result = stmt.run(id);
    return result;
  },


  // ========== returns the current season if exists, otherwise returns undefined ==========
  getCurrentSeason() {
    const currentDate = new Date().getTime();
    const stmt = db.prepare(`
        SELECT DISTINCT s.*
        FROM season s
        JOIN json_each(s.terms) AS t
        ON json_extract(t.value, '$.startDate') < ?
        AND json_extract(t.value, '$.endDate') > ?;
            `);
    return stmt.get(currentDate, currentDate) as sqliteSchoolSeason | undefined;
  },




};
