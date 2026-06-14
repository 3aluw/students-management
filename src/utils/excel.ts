import * as XLSX from 'xlsx';
import type { ArabicXLSXStudentProperties } from '~/data/static';
import type { ArabicXLSXType, InArabic, LocalAbsence, LocalLateness, PropDict, Student, XLSXAbsnece, XLSXLateness, XLSXStudent, XLSXType } from "~/data/types";

export const transformStudentToExcelVersion = (student: Student): XLSXStudent => {
    const { class_id, exited_at, status, birth_date, ...rest } = student;

    return {
        ...rest,
        birth_date: new Date(birth_date),
    }
};

type ExcelEventVersion<T extends LocalLateness | LocalAbsence> = T extends LocalLateness ? XLSXLateness : XLSXAbsnece;
export const transformEventToExcelVersion = <T extends LocalAbsence | LocalLateness>
    (event: T): ExcelEventVersion<T> => {
    const { reason, first_name, last_name } = event

    const base: XLSXAbsnece = {
        reason, first_name, last_name,
        reason_accepted: Boolean(event.reason_accepted),
        date: new Date(event.date),
        class: "",
    }

    if ("late_by" in event) {
        return { ...base, late_by: event.late_by } as ExcelEventVersion<T>
    }

    return base as ExcelEventVersion<T>
}


export const getFormattedStudentJson = (students: Student[], Dict : typeof ArabicXLSXStudentProperties) => {

    // 3. Map the rows using the Header Display Names as JSON keys
    const structuredData = students.map(student => {
        const XLSXStudent = transformStudentToExcelVersion(student)
        const formattedRow = transformToArabic(XLSXStudent, Dict)
        return formattedRow;
    });
    return structuredData;
}

export const getFormattedEventJson = <
    T extends LocalAbsence | LocalLateness,
    XLSXT extends ExcelEventVersion<T>,
    Dict extends PropDict<XLSXT>
>(
    records: T[],
    dict: Dict
): InArabic<XLSXT, Dict>[] => {
    return records.map((record) => {
        const xlsx = transformEventToExcelVersion(record) as XLSXT;
        return transformToArabic(xlsx, dict);
    });
};


export const exportXlsx = (data: ArabicXLSXType[], fileName: string) => {

    // 2. Create a new, blank workbook
    const workbook = XLSX.utils.book_new();

    // 3. Convert JSON data to a worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 4. Append the worksheet to the workbook with a name
    XLSX.utils.book_append_sheet(workbook, worksheet, fileName);
    // 5. Write the file to disk
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
