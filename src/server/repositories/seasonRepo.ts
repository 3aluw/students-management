import useDBUtils from "~/composables/useDBUtils";
import { EditSchoolSeason, NewSchoolSeason, SchoolSeason } from "~/data/types";
import db from "~/db/db";

type sqliteSchoolSeason = Omit<SchoolSeason, "terms"> & { terms: string };
const { generateDBSetClause } = useDBUtils();
export const seasonRepo = {
  // ========== returns the current season if exists, otherwise returns undefined ==========
  getCurrentSeason() {
    const currentDate = new Date().getTime();
    const stmt = db.prepare(`
        SELECT DISTINCT s.*
        FROM season s
        JOIN json_each(s.terms) AS t
        ON json_extract(t.value, '$.startDate') < ?
        AND json_extract(t.value, '$.endDate') > ?;
)
            `);
    return stmt.get(currentDate, currentDate) as sqliteSchoolSeason | undefined;
  },

  terminateCurrent() {
    const currentSeason = this.getCurrentSeason();
    if (!currentSeason) return;
    let terms = JSON.parse(currentSeason.terms) as SchoolSeason["terms"];

    const now = new Date().getTime();
    terms = terms
      .filter((term) => term.startDate < now)
      .sort((a, b) => a.endDate - b.endDate);
    const lastTerm = terms.at(-1);
    if (lastTerm) {
      lastTerm.endDate = new Date().setHours(24, 0, 0, 0);
    }
    this.editSeason({ ...currentSeason, terms });
  },

  editSeason(season: EditSchoolSeason) {
    try {
      const stringifiedTerms = JSON.stringify(season.terms);
      const updatedSeason = {
        ...season,
        terms: stringifiedTerms,
      };
      const values = Object.values(updatedSeason);
      const setClause = generateDBSetClause(updatedSeason);
      const stmt = db.prepare(`UPDATE season SET ${setClause} WHERE id = ?`);
      const info = stmt.run(...values, season.id);
      return { success: true, id: info.lastInsertRowid, info };
    } catch (error) {
      console.error("Error creating season:", error);
     throw new Error("فشلت عملية تعديل الموسم ", { cause: error });
    }
  },

  createSeason(season: NewSchoolSeason) {
    try {
      const stringifiedTerms = JSON.stringify(season.terms);
      const newSeason = {
        ...season,
        terms: stringifiedTerms,
      };
      const stmt = db.prepare(`INSERT INTO season (name, terms) VALUES (?, ?)`);
      const info = stmt.run(season.name, stringifiedTerms);
      return { success: true, id: info.lastInsertRowid, info };
    } catch (error) {
      console.error("Error creating season:", error);
     throw new Error("فشلت عملية إنشاء الموسم الجديد", { cause: error });
    }
  },
};
