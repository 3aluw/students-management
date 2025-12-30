import db from "~/db/db";
import type { SchoolSeason } from "~/data/types";

export default defineEventHandler(() => {
  const stmt = db.prepare("SELECT * FROM season");
  const seasons = stmt.all() as (Omit<SchoolSeason, "terms"> & {
    terms: string;
  })[];
  const parsedSeasons: SchoolSeason[] = seasons.map((season) => ({
    ...season,
    terms: JSON.parse(season.terms) as SchoolSeason["terms"],
  }));
  return parsedSeasons as SchoolSeason[];
});
