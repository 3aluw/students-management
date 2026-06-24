import { BatchEditStudent, ClassPromotionMap, EditStudent, NewStudent, Student, StudentsQueryFilters } from "~/models/types";
import { studentRepo } from "../repositories/studentRepo";

export const studentService = {
  getStudents(query: StudentsQueryFilters | { ids: number[] }) {
    if ('ids' in query) return studentRepo.getStudentsByIds(query.ids);
    return studentRepo.getStudents(query)
  },

  createStudent(studentData: NewStudent) {
    const result = studentRepo.createStudent(studentData);
    if (result.changes === 0) {
      throw createError({
        statusCode: 404,
        message: "لم يتم إنشاء الطالب",
      });
    }

    return {
      message: "تم إنشاء الطالب",
    };
  },
  createStudents(newStudents: NewStudent[]) {
    const throwFailError = (error?: unknown) => {
      throw createError({
        statusCode: 400,
        message: "لم يتم إنشاء الطلبة الجدد",
        cause: error
      })
    }
    let result = {
      changes: 0
    };
    try {
      result = studentRepo.createStudents(newStudents)
    }
    catch (error) {
      throwFailError(error)
    }

    const studentsCount = newStudents.length
    if (result.changes < studentsCount) {
      throw createError({
        statusCode: 409,
        message: "تم إنشاء بعض الطلبة الجدد ، لكن حدثت مشكلة أثناء إنشاء البعض الآخر (تم إضافة " + result.changes + " من " + studentsCount + ")",
      });
    }
    return {
      message: "تم إنشاء الطلبة الجدد",
    };
  },
  updateStudent(studentData: EditStudent) {
    const result = studentRepo.updateStudent(studentData);

    if (result.changes === 0) {
      throw createError({
        statusCode: 404,
        message: "لم يتم تعديل الطالب",
      });
    }

    return {
      message: "تم تعديل الطالب",
    };

  },

  updateStudents(studentsData: BatchEditStudent | EditStudent[]) {
    const throwFailError = (error?: unknown) => {
      throw createError({
        statusCode: 400,
        message: "لم يتم تعديل الطلبة المحددين",
        cause: error
      })
    }
    let result = {
      changes: 0
    };
    try {
      if (Array.isArray(studentsData)) {
        result = studentRepo.updateStudentsByPayload(studentsData)
      } else {
        result = studentRepo.updateStudentsByIds(studentsData);
      }
    }
    catch (error) {
      throwFailError(error)
    }
    if (result.changes === 0) throwFailError()
    const studentsCount = Array.isArray(studentsData) ? studentsData.length : studentsData.ids.length
    if (result.changes < studentsCount) {
      throw createError({
        statusCode: 409,
        message: "تم تعديل الطلبة المحددين ، لكن بعضهم لم يتم تعديله (تم إضافة " + result.changes + " من " + studentsCount + ")",
      });
    }
    return {
      message: "تم تعديل الطلبة المحددين",
    };

  },

  deleteStudents(ids: number[]) {
    if (!ids.length) {
      throw createError({
        statusCode: 400,
        message: "لا يمكن حذف قائمة فارغة",
      });
    }
    const result = studentRepo.deleteStudentsByIds(ids);

    if (result.changes === 0) {
      throw createError({
        statusCode: 404,
        message: "لم يتم إيجاد الطلبة",
      });
    }

    return {
      message: "تم حذف الطلبة الذين تم تحديدهم",
      count: result.changes,
    };
  },
  promoteStudents(promotionMap: ClassPromotionMap, repeaters: Student["id"][]) {
    try {
      studentRepo.handlesStudentsPromotion(promotionMap, repeaters);
    } catch (error) {
      throw new Error("فشلت عملية ترقية الطلبة", { cause: error });
    }
  },
};
