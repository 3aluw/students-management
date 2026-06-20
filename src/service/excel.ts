import * as XLSX from "xlsx";
import type { ArabicXLSXStudentProperties } from "~/data/static";
import type {
  ActiveStudent,
  ArabicXLSXType,
  EditStudent,
  InArabic,
  LocalAbsence,
  LocalLateness,
  NewStudent,
  Option,
  PropDict,
  Student,
  XLSXAbsence,
  XLSXLateness,
  XLSXStudent,
  XLSXType,
} from "~/data/types";

/* -------------------------------------------------------------------------- */
/*                                EXPORT LOGIC                                */
/* -------------------------------------------------------------------------- */

/*=================== STUDENT =================*/

/**
 * Student ===> XLSX version of Student
 */
export const transformStudentToExcelVersion = (
  student: Student,
): XLSXStudent => {
  const { class_id, exited_at, status, birth_date, ...rest } = student;

  return {
    ...rest,
    birth_date: new Date(birth_date),
  };
};

/**
 * Coordination function: Array of Student ====> XLSX version of Student in Arabic
 */
export const getFormattedStudentJson = (
  students: Student[],
  Dict: typeof ArabicXLSXStudentProperties,
) => {
  // Map the rows using the Header Display Names as JSON keys
  const structuredData = students.map((student) => {
    const XLSXStudent = transformStudentToExcelVersion(student);
    const formattedRow = transformToArabic(XLSXStudent, Dict);
    return formattedRow;
  });
  return structuredData;
};

/*=================== EVENTS =================*/

type ExcelEventVersion<T extends LocalLateness | LocalAbsence> =
  T extends LocalLateness ? XLSXLateness : XLSXAbsence;
/**
 * Event ===> XLSX version of that Event
 *  @remarks This function takes classOptions as a parameter to prevent the inclusion of store here (Since utils runs out of Nuxt context)
 */
export const transformEventToExcelVersion = <
  T extends LocalAbsence | LocalLateness,
>(
  event: T,
  classOptions: Option[],
): ExcelEventVersion<T> => {
  const { reason, first_name, last_name } = event;

  const base: XLSXAbsence = {
    reason,
    first_name,
    last_name,
    reason_accepted: Boolean(event.reason_accepted),
    date: new Date(event.date),
    class: getClassName(classOptions, event.class_id) ?? "",
  };

  if ("late_by" in event) {
    return { ...base, late_by: event.late_by } as ExcelEventVersion<T>;
  }

  return base as ExcelEventVersion<T>;
};

/**
 * Array of Event ====>  Array of Event ===> XLSX version of Event in Arabic
 *  @remarks This function takes classOptions as a parameter to prevent the inclusion of store here (Since utils runs out of Nuxt context)
 */
export const getFormattedEventJson = <
  T extends LocalAbsence | LocalLateness,
  XLSXT extends ExcelEventVersion<T>,
  Dict extends PropDict<XLSXT>,
>(
  records: T[],
  dict: Dict,
  classOptions: Option[],
): InArabic<XLSXT, Dict>[] => {
  return records.map((record) => {
    const xlsx = transformEventToExcelVersion(record, classOptions) as XLSXT;
    return transformToArabic(xlsx, dict);
  });
};

/*=========== function to export to XLSX ==========*/
/**
 * function to export Student[] / Event[] to XLSX
 */
export const exportXlsx = (data: ArabicXLSXType[], fileName: string) => {
  // 1. Create a new, blank workbook
  const workbook = XLSX.utils.book_new();

  // 2. Convert JSON data to a worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 3. Append the worksheet to the workbook with a name
  XLSX.utils.book_append_sheet(workbook, worksheet, fileName);

  // 4. Write the file to disk
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/* -------------------------------------------------------------------------- */
/*                                IMPORT LOGIC                                */
/* -------------------------------------------------------------------------- */

/*=================== STUDENT =================*/
type XLSXStudentArabicDict = typeof ArabicXLSXStudentProperties;
type NewXLSXStudent = Omit<XLSXStudent, "id">;
type ImportedNewXLSXStudent = InArabic<NewXLSXStudent, XLSXStudentArabicDict>;
type ImportedExistingXLSXStudent = InArabic<XLSXStudent, XLSXStudentArabicDict>;
type ImportedXLSXData =
  | ImportedNewXLSXStudent[]
  | ImportedExistingXLSXStudent[];

/*=========== function to export to XLSX ==========*/
/**
 *  parse excel file ===> InArabic student rows
 */
export async function parseExcelFile(file: File): Promise<ImportedXLSXData> {
  try {
    const fileData = await file.arrayBuffer();

    if (!fileData) throw new Error(" UNSUPPORTED_FILE");
    const workbook = XLSX.read(fileData, { type: "array", cellDates: true });

    const sheetName = workbook.SheetNames[0]; // Get the first sheet
    if (!sheetName) throw new Error("EMPTY_FILE");
    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet) as ImportedXLSXData;
    if (!rows.length) throw new Error("NO_ROWS");
    return rows;
  } catch (error) {
    throw new Error("UNSUPPORTED_FILE");
  }
}

const isExistingStudent = (
  student: XLSXStudent | NewXLSXStudent,
): student is XLSXStudent =>
  "id" in student && typeof student["id"] === "number";
/**
 *  Grouping according to id: 
 *   Id exists Possible existing student 
 *   else: Possible new student
 */
export const groupByExistence = (
  XLSXStudents: NewXLSXStudent[] | XLSXStudent[],
) => {
  const newStudents: NewXLSXStudent[] = [];
  const existingStudents: XLSXStudent[] = [];
  XLSXStudents.forEach((student) => {
    if (isExistingStudent(student)) {
      existingStudents.push(student);
    } else {
      newStudents.push(student);
    }
  });
  return { newStudents, existingStudents };
};

/*Possible new students logic */

export const formatPossibleNewStudents =  (newXLSXStudents: NewXLSXStudent[], classId: number) => {
    const newStudents: NewStudent[] = newXLSXStudents.map((st) => {
        return { ...st, birth_date: st.birth_date.getTime(), status: "active", exited_at: null, class_id: classId }
    })
   return newStudents
}
export const groupExistingImportedStudents = (
  existingStudents: XLSXStudent[],
  students: Student[],
) => {
  //if in students not in XLSX : candidate of removing
  const removingCandidates = useArrayDifference(
    students,
    existingStudents as any,
    (value, othVal) => value.id === othVal.id,
  );

  //if in XLSX not in students : form other class
  const transferCandidates: XLSXStudent[] = [];
  //if there is a change : to update it
  const editStudents: EditStudent[] = [];

  for (const XLSXStudent of existingStudents) {
    const student = students.find((s) => s.id === XLSXStudent.id);

    if (!student) {
      transferCandidates.push(XLSXStudent);
      continue;
    }
    const changes = getChangesInStudent(student, XLSXStudent);
    if (changes) {
      editStudents.push({ ...changes, id: student.id });
    }
  }
  return {
    editStudents,
    transferCandidates,
    toRemoveCandidates: removingCandidates.value,
  };
};

export const getChangesInStudent = (
  existingStudent: Student,
  XLSXStudent: XLSXStudent,
) => {
  const changes: Partial<ActiveStudent> = {};
  const formattedStudent: Partial<ActiveStudent> = {
    ...XLSXStudent,
    birth_date: XLSXStudent.birth_date.getTime(),
  };

  const newEntries = Object.entries(formattedStudent) as [
    keyof EditStudent,
    EditStudent[keyof EditStudent],
  ][];

  newEntries.forEach(([key, value]) => {
    if (existingStudent[key] !== value) (changes as any)[key] = value;
  });
  return Object.keys(changes).length === 0 ? undefined : changes;
};
