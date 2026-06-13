import type { Student, XLSXStudent } from "~/data/types";

export const transformStudentToExcelVersion = (student: Student): XLSXStudent => {
    const { class_id, exited_at, status, birth_date, ...rest } = student;

    return {
        ...rest,
        birth_date: new Date(birth_date),
    }
};