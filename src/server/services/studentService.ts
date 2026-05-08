import { ClassPromotionMap, EditStudent, NewStudent, Student } from "~/data/types";
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

  createStudent(studentData: NewStudent) {
    try {
      return studentRepo.createStudent(studentData);
    } catch (error) {
      throw createError({
        statusCode: 500,
        statusMessage: "فشلت عملية إنشاء الطالب، يرجى التأكد من صحة البيانات المدخلة",
        cause: error,
      });
    }
  },

  updateStudent(studentData: EditStudent) {
    try {
      studentRepo.updateStudent(studentData);
    } catch (error) {
      throw createError({
        statusCode: 500,
        statusMessage: "فشلت عملية تحديث معلومات الطالب، يرجى التأكد من صحة البيانات المدخلة",
        cause: error,
      });
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
      statusMessage: "تم حذف الطلبة الذين تم تحديدهم",
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
