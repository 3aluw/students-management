import { absenceRepo } from "../repositories/absenceRepo";
import type { BatchEditAbsence, EditAbsence, EventQueryFilters, NewAbsence } from "~/data/types";

export const absenceService = {
    getAbsences: (filters: EventQueryFilters) => {
        return absenceRepo.getAbsences(filters);
    },

    deleteAbsences: (absenceIds: number[]) => {
        const result = absenceRepo.deleteAbsences(absenceIds);
        if (result.changes === 0) {
            throw createError({
                statusCode: 404,
                message: "لم يتم حذف الغياب المحدد",
            });
        }
        if (result.changes < absenceIds.length) {
            throw createError({
                statusCode: 409,
                message: "تم حذف بعض الغيابات المحددة، لكن بعضها لم يتم العثور عليه (تم حذف " + result.changes + " من " + absenceIds.length + ")",
            });
        }
        return { message: "تم حذف الغيابات المحددة بنجاح" };
    },

    createAbsences: (absences: NewAbsence[]) => {
        const throwFailError = (error?: unknown) => {
            throw createError({
                statusCode: 400,
                message: "لم يتم إضافة الغيابات الجديدة",
                cause: error
            })
        }
        let result = {
            changes: 0
        };
        try {
            result = absenceRepo.createAbsences(absences);
        } catch (error) {
            throwFailError(error)
        }

        if (result.changes === 0) throwFailError()
        if (result.changes < absences.length) {
            throw createError({
                statusCode: 409,
                message: "تم إضافة بعض الغيابات الجديدة، لكن بعضها لم يتم إضافته (تم إضافة " + result.changes + " من " + absences.length + ")",
            });
        }
        return { message: "تم إضافة الغيابات الجديدة بنجاح", };
    },

    editAbsence: (absence: EditAbsence) => {
        const result = absenceRepo.editAbsence(absence);
        if (result.changes === 0) {
            throw createError({
                statusCode: 404,
                message: "لم يتم العثور على الغياب المحدد للتحديث",
            });
        }
        return { message: "تم تحديث الغياب المحدد بنجاح" };
    },

    editAbsences: (abcenses: BatchEditAbsence) => {
        const result = absenceRepo.editAbsences(abcenses);
        if (result.changes === 0) {
            throw createError({
                statusCode: 404,
                message: "لم يتم العثور على الغيابات المحددة للتحديث",
            });
        }
        if (result.changes < abcenses.ids.length) {
            throw createError({
                statusCode: 409,
                message: "تم تحديث بعض الغيابات المحددة، لكن بعضها لم يتم العثور عليه (تم تحديث " + result.changes + " من " + abcenses.ids.length + ")",
            });
        }
        return { message: "تم تحديث الغيابات المحددة بنجاح" };
    }

}