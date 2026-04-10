import { ClassPromotionMap, Student } from "~/data/types";
import { studentRepo } from "../repositories/studentRepo";

export const studentService = {
  promoteStudents(promotionMap: ClassPromotionMap, repeaters: Student[]) {
    const repeatersIds = repeaters.map((student) => student.id);
    try{
    studentRepo.handlesStudentsPromotion(promotionMap, repeatersIds);
    }catch (error) {
     throw new Error( "فشلت عملية ترقية الطلبة", { cause: error });
    }
  },
};
