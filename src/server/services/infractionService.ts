import type {
  BatchEditInfraction,
  EditInfraction,
  EventQueryFilters,
  NewInfraction,
} from "~/models/types";
import { infractionRepo } from "../repositories/infractionRepo";


export const infractionService = {
  getInfraction: (filters: EventQueryFilters) => {
    return infractionRepo.getInfractions(filters);
  },

  deleteInfractions: (infractionIds: number[]) => {
    const result = infractionRepo.deleteInfractions(infractionIds);
    if (result.changes === 0) {
      throw createError({
        statusCode: 404,
        message: "لم يتم حذف المخالفات  المحددة",
      });
    }
    if (result.changes < infractionIds.length) {
      throw createError({
        statusCode: 409,
        message:
          "تم حذف بعض الخالفات المحددة، لكن بعضها لم يتم العثور عليه (تم حذف " +
          result.changes +
          " من " +
          infractionIds.length +
          ")",
      });
    }
    return { message: "تم حذف المخالفات المحددة بنجاح" };
  },

  createInfractions: (infractions: NewInfraction[]) => {
    const throwFailError = (error?: unknown) => {
      throw createError({
        statusCode: 400,
        message: "لم يتم إضافة الماخلفات الجديدة",
        cause: error,
      });
    };
    let result = {
      changes: 0,
    };
    try {
      result = infractionRepo.createInfraction(infractions);
    } catch (error) {
      throwFailError(error);
    }
    if (result.changes === 0) throwFailError();
    if (result.changes < infractions.length) {
      throw createError({
        statusCode: 409,
        message:
          "تم إضافة بعض المخالفات الجديدة، لكن بعضها لم يتم إضافته (تم إضافة " +
          result.changes +
          " من " +
          infractions.length +
          ")",
      });
    }
    return { message: "تم إضافة المخالفات الجديدة بنجاح" };
  },

  editInfraction: (infraction: EditInfraction) => {
    const result = infractionRepo.editInfraction(infraction);
    if (result.changes === 0) {
      throw createError({
        statusCode: 404,
        message: "لم يتم العثور على المخالفة المحددة",
      });
    }
    return { message: "تم تحديث المخالفة المحددة بنجاح" };
  },

  batchEditInfraction: (infractions: BatchEditInfraction) => {
    const result = infractionRepo.batchEditInfraction(infractions);
    if (result.changes === 0) {
      throw createError({
        statusCode: 404,
        message: "لم يتم العثور على المخالفات المحددة للتحديث",
      });
    }
    if (result.changes < infractions.ids.length) {
      throw createError({
        statusCode: 207,
        message:
          "تم تحديث بعض المخالفات المحددة، لكن بعضها لم يتم العثور عليه (تم تحديث " +
          result.changes +
          " من " +
          infractions.ids.length +
          ")",
      });
    }
    return { message: "تم تحديث المخالفات المحددة بنجاح" };
  },
};
