import { ClassPromotionMap, Student } from "~/data/types";
import { studentRepo } from "../repositories/studentRepo";

export const studentService = {
  getStudents(query: { classId?: string; name?: string }) {
    const { classId, name } = query;
    if (classId) {
      return studentRepo.findByClassId(Number(classId));
    } else if (name) {
      return studentRepo.findByName(name);
    } else {
      return studentRepo.getAll();
    }
  },
  deleteStudents(ids: number[]) {
    if (!ids.length) {
      throw createError({
        statusCode: 400,
        statusMessage: "لا يمكن حذف قائمة فارغة",
      });
    }
    const result = studentRepo.deleteStudentsByIds(ids);

    if (result.changes === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "لم يتم إيجاد الطلبة",
      });
    }

    return {
      message: "تم حذف الطلبة الذين تم تحديدهم",
      deletedCount: result.changes,
    };
  },
  promoteStudents(promotionMap: ClassPromotionMap, repeaters: Student[]) {
    const repeatersIds = repeaters.map((student) => student.id);
    try {
      studentRepo.handlesStudentsPromotion(promotionMap, repeatersIds);
    } catch (error) {
      throw new Error("فشلت عملية ترقية الطلبة", { cause: error });
    }
  },
};
