import type { BatchEditAbsence, BatchEditLateness, EditAbsence, EditLateness, EventQueryFilters, NewAbsence, NewLateness } from "~/data/types";
import { latenessRepo } from "../repositories/latenessRepo";

export const latenessService = {
    getLateness: (filters: EventQueryFilters) => {
        return latenessRepo.getLateness(filters);
    },

    deleteLateness: (latenessIds: number[]) => {
        const result = latenessRepo.deleteLateness(latenessIds);
        if (result.changes === 0) {
            throw createError({
                statusCode: 404,
                message: "لم يتم حذف التأخير المحدد",
            });
        }
        if (result.changes < latenessIds.length) {
            throw createError({
                statusCode: 409,
                message: "تم حذف بعض التأخيرات المحددة، لكن بعضها لم يتم العثور عليه (تم حذف " + result.changes + " من " + latenessIds.length + ")",
            });
        }
        return { message: "تم حذف التأخيرات المحددة بنجاح" };
    },

    createLateness: (lateness: NewLateness[]) => {
        const result = latenessRepo.createLateness(lateness);
        if (result.changes === 0) {
            throw createError({
                statusCode: 400,
                message: "لم يتم إضافة التأخيرات الجديدة",
            });
        }
        if (result.changes < lateness.length) {
            throw createError({
                statusCode: 207,
                message: "تم إضافة بعض التأخيرات الجديدة، لكن بعضها لم يتم إضافته (تم إضافة " + result.changes + " من " + lateness.length + ")",
            });
        }
        return { message: "تم إضافة التأخيرات الجديدة بنجاح", };
    },

    editLateness: (lateness: EditLateness) => {
        const result = latenessRepo.editLateness(lateness);
        if (result.changes === 0) {
            throw createError({
                statusCode: 404,
                message: "لم يتم العثور على التأخير المحدد للتحديث",
            });
        }
        return { message: "تم تحديث التأخير المحدد بنجاح" };
    },

    batchEditLateness: (lateness: BatchEditLateness) => {
        const result = latenessRepo.batchEditLateness(lateness);
        if (result.changes === 0) {
            throw createError({
                statusCode: 404,
                message: "لم يتم العثور على التأخيرات المحددة للتحديث",
            });
        }
        if (result.changes < lateness.ids.length) {
            throw createError({
                statusCode: 207,
                message: "تم تحديث بعض التأخيرات المحددة، لكن بعضها لم يتم العثور عليه (تم تحديث " + result.changes + " من " + lateness.ids.length + ")",
            });
        }
        return { message: "تم تحديث التأخيرات المحددة بنجاح" };
    }

}