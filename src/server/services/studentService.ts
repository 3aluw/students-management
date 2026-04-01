import { ClassPromotionMap, Student } from "~/data/types";
import { studentRepo } from "../repositories/studentRepo";

export const studentService = {
  promoteStudents(promotionMap: ClassPromotionMap, repeaters: Student[]) {
    const repeatersIds = repeaters.map((student) => student.id);
    studentRepo.handlesStudentsPromotion(promotionMap, repeatersIds);
  },
};
