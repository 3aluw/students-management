import { absenceRepo } from "../repositories/absenceRepo";
import type { EventQueryFilters } from "~/data/types";

export const absenceService = {
    getAbsences: (filters: EventQueryFilters) => {
        return absenceRepo.getAbsences(filters);
    },

    deleteAbsences: (absenceIds: number[]) => {
        const result = absenceRepo.deleteAbsences(absenceIds);
        if (result.changes === 0) {
            throw createError({
                statusCode: 404,
                statusMessage: "لم يتم حذف الغياب المحدد",
            });
        }
        if (result.changes < absenceIds.length) {
            throw createError({
                statusCode: 207,
                statusMessage: "تم حذف بعض الغيابات المحددة، لكن بعضها لم يتم العثور عليه (تم حذف " + result.changes + " من " + absenceIds.length + ")",
            });
        }
        return { message: "تم حذف الغيابات المحددة بنجاح" };
    }
}