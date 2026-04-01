// server/services/seasonService.ts
import db from "~/db/db";
import { seasonRepo } from "../repositories/seasonRepo";
import { studentService } from "./studentService";
import { NewSchoolSeason, NewSeasonPayload, SchoolSeason } from "~/data/types";
import useDataUtils from "~/composables/useDataUtils";

// ========== validates if the season collides with an existing season ==========
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
  if (legitimateCollapsingSeason) {
    throw new Error(
      `Season date collides with an existing season ${legitimateCollapsingSeason.name}`,
    );
  }
};

export const seasonService = {
  runNewSeasonWorkflow(payload: NewSeasonPayload) {
    const trx = db.transaction((data: NewSeasonPayload) => {
      const { newSeason, terminateCurrentSeason, classPromotionMap, repeaters } = data;

      // ========== Season functions==========
      if (terminateCurrentSeason) {
        seasonRepo.terminateCurrent();
      }

      if (data.newSeason) {
        seasonRepo.createSeason(newSeason);
      }
     // ========== Student promotion functions==========
     if(Object.keys(classPromotionMap).length > 0) {
       studentService.promoteStudents(classPromotionMap, repeaters);
     }
      return { success: true };  /* Manage feedbacks */
    });

    return trx(payload);
  },
};
