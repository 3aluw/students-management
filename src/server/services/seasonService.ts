// server/services/seasonService.ts
import db from "~/db/db";
import { seasonRepo } from "../repositories/seasonRepo";
import { studentService } from "./studentService";
import { NewSchoolSeason, NewSeasonPayload, SchoolSeason } from "~/data/types";
import useDataUtils from "~/composables/useDataUtils";

const validateSeasonCollision = (
  newSeason: NewSchoolSeason,
  terminateCurrentSeason: boolean,
) => {
  const seasonStart = newSeason.terms[0].startDate;
  const collapsingSeasonStmt = db.prepare(`
  SELECT s.*
  FROM season s
  WHERE EXISTS (
      SELECT 1
      FROM json_each(s.terms) AS t
      WHERE json_extract(t.value, '$.endDate') > ?
  )
`);
  const collapsingSeason = collapsingSeasonStmt.all(seasonStart) as
    | SchoolSeason[]
    | undefined;
  // if not collision ; return undefined
  if (!collapsingSeason) return undefined;
  
  // check weather the collision is happening with the current season which the user is about terminating or with other season
  const legitimateCollapsingSeason = collapsingSeason.find((season) => {
    const status = useDataUtils().getSeasonStatus(season);

    // Acceptable collision only if it's the current season AND user is terminating it
    if (status === "current" && terminateCurrentSeason) return false;

    // Any other season collision is considered legitimate
    return true;
  });
  return legitimateCollapsingSeason;
};

export const seasonService = {
  runNewSeasonWorkflow(payload: NewSeasonPayload) {
    const trx = db.transaction((data) => {
      if (data.terminateCurrentSeason) {
        seasonRepo.terminateCurrent();
      }

      if (data.repeaters?.length) {
        studentService.markRepeaters(data.repeaters);
      }

      if (data.promoteStudents) {
        studentService.promote(data.promotionMap, data.repeaters);
      }

      if (data.newSeason) {
        seasonRepo.create(data.newSeason);
      }

      return { success: true };
    });

    return trx(payload);
  },
};
