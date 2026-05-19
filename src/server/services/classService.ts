import { classRepo } from "../repositories/classRepo";

export const classService = {
    getClasses() {
        return classRepo.getClasses();
    },

    deleteClass(id: string) {
        const result = classRepo.deleteClass(Number(id));
        if (result.changes === 0) {
            throw createError({
                statusCode: 404,
                statusMessage: "لم يتم إيجاد القسم",
            });
        }

        return {
            message: "تم حذف القسم",
        };
    }
}