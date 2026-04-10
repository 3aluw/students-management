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

  promoteStudents(promotionMap: ClassPromotionMap, repeaters: Student[]) {
    const repeatersIds = repeaters.map((student) => student.id);
    try {
      studentRepo.handlesStudentsPromotion(promotionMap, repeatersIds);
    } catch (error) {
      throw new Error("فشلت عملية ترقية الطلبة", { cause: error });
    }
  },
};
