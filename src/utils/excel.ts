import * as XLSX from 'xlsx';
import type { ArabicXLSXStudentProperties } from '~/data/static';
import type { ArabicXLSXType, InArabic, LocalAbsence, LocalLateness, Option, PropDict, Student, XLSXAbsnece, XLSXLateness, XLSXStudent, XLSXType } from "~/data/types";


/*=========== functions to transform a record to its excel version ==========*/
/**
 * Student ===> XLSX version of Student
 */
export const transformStudentToExcelVersion = (student: Student): XLSXStudent => {
    const { class_id, exited_at, status, birth_date, ...rest } = student;

    return {
        ...rest,
        birth_date: new Date(birth_date),
    }
};

type ExcelEventVersion<T extends LocalLateness | LocalAbsence> = T extends LocalLateness ? XLSXLateness : XLSXAbsnece;
/**
 * Event ===> XLSX version of that Event
 *  @remarks This function takes classOptions as a parameter to prevent the inclusion of store here (Since utils runs out of Nuxt context)
 */
export const transformEventToExcelVersion = <T extends LocalAbsence | LocalLateness>
    (event: T, classOptions: Option[]): ExcelEventVersion<T> => {
    const { reason, first_name, last_name } = event

    const base: XLSXAbsnece = {
        reason, first_name, last_name,
        reason_accepted: Boolean(event.reason_accepted),
        date: new Date(event.date),
        class: getClassName(classOptions, event.class_id) ?? '',
    }

    if ("late_by" in event) {
        return { ...base, late_by: event.late_by } as ExcelEventVersion<T>
    }

    return base as ExcelEventVersion<T>
}

/*=========== Cordination functions to transform an array of record to its excel version with Arabic props ==========*/

/**
 * Array of Student ====> XLSX version of Student in Arabic
 */
export const getFormattedStudentJson = (students: Student[], Dict: typeof ArabicXLSXStudentProperties) => {

    // 3. Map the rows using the Header Display Names as JSON keys
    const structuredData = students.map(student => {
        const XLSXStudent = transformStudentToExcelVersion(student)
        const formattedRow = transformToArabic(XLSXStudent, Dict)
        return formattedRow;
    });
    return structuredData;
}

/**
 * Array of Event ====> XLSX version of that Event in Arabic
 *  @remarks This function takes classOptions as a parameter to prevent the inclusion of store here (Since utils runs out of Nuxt context)
 */
export const getFormattedEventJson = <
    T extends LocalAbsence | LocalLateness,
    XLSXT extends ExcelEventVersion<T>,
    Dict extends PropDict<XLSXT>
>(
    records: T[],
    dict: Dict,
    classOptions: Option[]
): InArabic<XLSXT, Dict>[] => {
    return records.map((record) => {
        const xlsx = transformEventToExcelVersion(record, classOptions) as XLSXT;
        return transformToArabic(xlsx, dict);
    });
};

/*=========== function to export to XLSX ==========*/
export const exportXlsx = (data: ArabicXLSXType[], fileName: string) => {
    // 1. Create a new, blank workbook
    const workbook = XLSX.utils.book_new();

    // 2. Convert JSON data to a worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 3. Append the worksheet to the workbook with a name
    XLSX.utils.book_append_sheet(workbook, worksheet, fileName);

    // 4. Write the file to disk
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
