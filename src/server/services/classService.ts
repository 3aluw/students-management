import { classRepo } from "../repositories/classRepo";
import type { EditClass, NewClass } from "~/data/types";

export const classService = {
    getClasses() {
        return classRepo.getClasses();
    },

    deleteClass(id: string) {
        const result = classRepo.deleteClass(Number(id));
        if (result.changes === 0) {
            throw createError({
                statusCode: 404,
                message: "لم يتم إيجاد القسم",
            });
        }

        return {
            message: "تم حذف القسم",
        };
    },

    createClass(classObject: NewClass) {
        const result = classRepo.createClass(classObject);
        if (result.changes === 0) {
            throw createError({
                statusCode: 404,
                message: "لم يتم إضافة القسم",
            });
        }

        return {
            message: "تمت إضافة القسم",
        };
    },

    editClass(classObject: EditClass) {
        const result = classRepo.editClass(classObject);
        if (result.changes === 0) {
            throw createError({
                statusCode: 404,
                message: "لم يتم تعديل القسم المحدد",
            });
        }

        return {
            message: "تم تعديل القسم المحدد",
        };
    }
}