import db from "~/db/db";
import { seasonRepo } from "../repositories/seasonRepo";
import { studentService } from "./studentService";
import {
  EditSchoolSeason,
  NewSchoolSeason,
  NewSeasonPayload,
  SchoolSeason,
} from "~/data/types";
import useDataUtils from "~/composables/useDataUtils";
import useDBUtils from "~/composables/useDBUtils";

export const seasonService = {
  runNewSeasonWorkflow(payload: NewSeasonPayload) {
    validateSeasonCollision(payload.newSeason, payload.terminateCurrentSeason);

    const trx = db.transaction((data: NewSeasonPayload) => {
      const {
        newSeason,
        terminateCurrentSeason,
        classPromotionMap,
        repeaters,
      } = data;

      const promoteStudentsAllowed = Object.keys(classPromotionMap).length > 0;

      /* Manage feedbacks using runSteps helper */
      useDBUtils().runSteps([
        // ========== Season functions==========
        {
          name: "إنهاء الموسم الحالي",
          run: () => seasonRepo.terminateCurrent(),
          when: () => terminateCurrentSeason,
        },
        {
          name: "إنشاء موسم جديد",
          run: () => seasonRepo.createSeason(newSeason),
        },
        // ========== Student promotion functions==========
        {
          name: "ترقية الطلاب",
          run: () =>
            studentService.promoteStudents(classPromotionMap, repeaters),
          when: () => promoteStudentsAllowed,
        },
      ]);
      return { message: "تم إنشاء الموسم الجديد بنجاح" };
    });

    return trx(payload);
  },

  getSeasons() {
    return seasonRepo.getSeasons();
  },
  createSeason(season: NewSchoolSeason) {
    const result = seasonRepo.createSeason(season);
    if (result.changes === 0) {
      throw createError({
        statusCode: 404,
        message: "لم يتم إضافة الموسم الدراسي",
      });
    }
    return {
      message: "تمت إضافة الموسم الدراسي بنجاح",
    };
  },

  editSeason(season: EditSchoolSeason) {

    const result = seasonRepo.editSeason(season);
    if (result.changes === 0) {
      throw createError({
        statusCode: 404,
        message: "لم يتم إيجاد الموسم المحدد",
      });
    }
    return {
      message: "تم تعديل الموسم بنجاح",
    };

  },
  deleteSeason(id: number) {
    const result = seasonRepo.deleteSeasons(id);
    if (result.changes === 0) {
      throw createError({
        statusCode: 404,
        message: "لم يتم إيجاد الموسم المحدد",
      });
    }
    return {
      message: "تم حذف الموسم المحدد",
    };
  }
};
// ========== INTERNAL : validates if the season collides with an existing season ==========
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
  if (!collapsingSeason) return true;

  // check weather the collision is happening with the current season which the user is about terminating or with other season
  const verifiedCollapsingSeason = collapsingSeason.find((season) => {
    const status = useDataUtils().getSeasonStatus(season);

    // Acceptable collision only if it's the current season AND user is terminating it
    if (status === "current" && terminateCurrentSeason) return false;

    // Any other season collision is considered verified
    return true;
  });
  console.log("verified collapsing season:", verifiedCollapsingSeason);

  if (verifiedCollapsingSeason) {
    throw new Error(
      `الموسم الجديد تتقاطع تواريخه مع الموسم : ${verifiedCollapsingSeason.name}`,
    );
  } else {
    return true;
  }
};
