import * as XLSX from "xlsx";
import type { ArabicXLSXStudentProperties } from "~/models/static";
import type {
  ActiveStudent,
  ArabicXLSXType,
  EditStudent,
  InArabic,
  LocalAbsence,
  LocalInfraction,
  LocalLateness,
  NewStudent,
  Option,
  PropDict,
  Student,
  XLSXAbsence,
  XLSXInfraction,
  XLSXLateness,
  XLSXStudent,
} from "~/models/types";
import { z } from "zod";
import { studentSchemas } from "~/models/zod schemas";
import { getClassName } from "~/service/entity";
/* -------------------------------------------------------------------------- */
/*                                EXPORT LOGIC                                */
/* -------------------------------------------------------------------------- */

/*=================== STUDENT =================*/

/**
 * Transforms a Student object into XLSX-compatible format for Excel export.
 * @param student - The student object to transform.
 * @returns An XLSXStudent object ready for Excel export.
 * @remarks
 * - Excludes `class_id`, `exited_at`, `status`, and `birth_date` from the source.
 * - Converts `birth_date` from number to a Date object.
 * - Other fields are passed through as-is.
 * @example
 * ```typescript
 * const student = { id: 1, first_name: "Ahmed", birth_date: "2000-01-15", class_id: 5, exited_at: null, status: "active" };
 * const xlsxStudent = studentToXLSXFormat(student);
 * // Returns: { id: 1, first_name: "Ahmed", birth_date: Date(2000-01-15) }
 * ```
 */
const studentToXLSXFormat = (student: Student): XLSXStudent => {
  const { class_id, exited_at, status, birth_date, ...rest } = student;

  return {
    ...rest,
    birth_date: new Date(birth_date),
  };
};

/**
 * Coordination functions: Formats an array of students for Excel export with Arabic column headers.
 * @param students - Array of Student objects to export.
 * @param Dict - The Arabic property name dictionary for XLSXStudent fields.
 * @returns An array of objects with Arabic property keys ready for Excel export.
 * @remarks
 * This function:
 * 1. Transforms each student to XLSX format using `studentToXLSXFormat`
 * 2. Translates property keys from English to Arabic using `transformToArabic`
 * @example
 * ```typescript
 * const students = [student1, student2];
 * const formatted = formatStudentsForExcelExport(students, ArabicXLSXStudentProperties);
 * // Returns: [{ "الاسم الأول": "Ahmed", "تاريخ الميلاد": "2000-01-15" }, ...]
 * ```
 */
export const formatStudentsForExcelExport = (
  students: Student[],
  Dict: typeof ArabicXLSXStudentProperties,
) => {
  // Map the rows using the Header Display Names as JSON keys
  const structuredData = students.map((student) => {
    const XLSXStudent = studentToXLSXFormat(student);
    const formattedRow = transformToArabic(XLSXStudent, Dict);
    return formattedRow;
  });
  return structuredData;
};

/*=================== EVENTS =================*/

type ExcelEventVersion<
  T extends LocalLateness | LocalAbsence | LocalInfraction,
> = T extends LocalLateness
  ? XLSXLateness
  : T extends LocalAbsence
    ? XLSXAbsence
    : XLSXInfraction;

/**
 * Transforms an absence or lateness event into XLSX-compatible format for Excel export.
 * @typeParam T - The event type (LocalAbsence or LocalLateness).
 * @param event - The event object to transform.
 * @param classOptions - Array of class options for looking up class names by ID.
 * @returns An ExcelEventVersion object (XLSXAbsence or XLSXLateness) ready for Excel export.
 * @remarks
 * - Common fields: `reason`, `first_name`, `last_name`, `reason_accepted`, `date`, `class`.
 * - For lateness events, includes `late_by` field.
 * - Uses `getClassName` to resolve class ID to class name (falls back to empty string).
 * - Type narrowing determines if the event is lateness or absence.
 * @example
 * ```typescript
 * // For absence
 * const absence = { reason: "Sick", first_name: "Ahmed", last_name: "Ali", reason_accepted: false, date: "2024-01-15", class_id: 3 };
 * const xlsxAbsence = eventToXLSXFormat(absence, classOptions);
 * // Returns: { reason: "Sick", first_name: "Ahmed", last_name: "Ali", reason_accepted: false, date: Date(2024-01-15), class: "3A" }
 *
 * // For lateness
 * const lateness = { ...absence, late_by: 15 };
 * const xlsxLateness = eventToXLSXFormat(lateness, classOptions);
 * // Returns: { ...base, late_by: 15 }
 * ```
 */
const eventToXLSXFormat = <
  T extends LocalAbsence | LocalLateness | LocalInfraction,
>(
  event: T,
  classOptions: Option[],
): ExcelEventVersion<T> => {
  const { reason, first_name, last_name } = event;

  const base = {
    reason,
    first_name,
    last_name,
    date: new Date(event.date),
    class: getClassName(classOptions, event.class_id) ?? "",
  };

  if ("late_by" in event) {
    return {
      ...base,
      late_by: event.late_by,
      reason_accepted: Boolean(event.reason_accepted),
    } as ExcelEventVersion<T>;
  }
  if ("reason_accepted" in event) {
    return {
      ...base,
      reason_accepted: Boolean(event.reason_accepted),
    } as ExcelEventVersion<T>;
  }
  if ("minutes_after_start" in event) {
    return {
      ...base,
      subject : event.subject
    } as ExcelEventVersion<T>;
  }
  return base as ExcelEventVersion<T>;
};

/**
 * Formats an array of absence/lateness events for Excel export with Arabic column headers.
 * @typeParam T - The event type (LocalAbsence or LocalLateness).
 * @typeParam XLSXT - The Excel version type (XLSXAbsence or XLSXLateness).
 * @typeParam Dict - The dictionary type mapping English keys to Arabic keys.
 * @param records - Array of event objects to export.
 * @param dict - The Arabic property name dictionary for XLSX event fields.
 * @param classOptions - Array of class options for looking up class names by ID.
 * @returns An array of objects with Arabic property keys ready for Excel export.
 * @remarks
 * This function:
 * 1. Transforms each event to XLSX format using `eventToXLSXFormat`
 * 2. Translates property keys from English to Arabic using `transformToArabic`
 * @example
 * ```typescript
 * const events = [absence1, lateness1];
 * const formatted = formatEventsForExcelExport(
 *   events,
 *   ArabicXLSXEventProperties,
 *   classOptions
 * );
 * // Returns: [{ "السبب": "Sick", "الاسم الأول": "Ahmed", "التأخير": 15 }, ...]
 * ```
 */
export const formatEventsForExcelExport = <
  T extends LocalAbsence | LocalLateness | LocalInfraction,
  XLSXT extends ExcelEventVersion<T>,
  Dict extends PropDict<XLSXT>,
>(
  records: T[],
  dict: Dict,
  classOptions: Option[],
): InArabic<XLSXT, Dict>[] => {
  return records.map((record) => {
    const xlsx = eventToXLSXFormat(record, classOptions) as XLSXT;
    return transformToArabic(xlsx, dict);
  });
};

/*=========== function to export to XLSX ==========*/
/**
 * Exports JSON data to an Excel (.xlsx) file and triggers a download.
 * @param data - Array of objects with Arabic property keys to export.
 * @param fileName - The base name for the output file (without extension).
 * @remarks
 * This function:
 * 1. Creates a new Excel workbook.
 * 2. Converts the JSON data to a worksheet using `json_to_sheet`.
 * 3. Appends the worksheet to the workbook with the file name as sheet name.
 * 4. Writes the file to disk triggering a browser download.
 * @example
 * ```typescript
 * const students = [
 *   { "الاسم الأول": "أحمد", "الاسم الأخير": "علي", "تاريخ الميلاد": "2000-01-15" },
 *   { "الاسم الأول": "سارة", "الاسم الأخير": "محمد", "تاريخ الميلاد": "2001-03-20" }
 * ];
 * exportToExcel(students, "طلاب_الفصل_الأول");
 * // Downloads: طلاب_الفصل_الأول.xlsx
 * ```
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

/*=========== Parsing / Validation / Grouping logic ==========*/

/**
 * Parses an uploaded Excel file and extracts data from the first sheet.
 * @param file - The Excel file to parse.
 * @returns A promise resolving to the imported XLSX data as an array of objects.
 * @throws {Error} With code "UNSUPPORTED_FILE" if the file cannot be read.
 * @throws {Error} With code "EMPTY_FILE" if the workbook has no sheets.
 * @throws {Error} With code "NO_ROWS" if the sheet has no data rows.
 * @remarks
 * - Reads the file as an ArrayBuffer.
 * - Uses XLSX library with `cellDates: true` to preserve date formatting.
 * - Only processes the first sheet in the workbook.
 * @example
 * ```typescript
 * try {
 *   const data = await parseExcelFileToJSON(file);
 *   console.log(`Imported ${data.length} rows`);
 * } catch (error) {
 *   console.error('Failed to parse file:', error.message);
 * }
 * ```
 */
export async function parseExcelFileToJSON(
  file: File,
): Promise<ImportedXLSXData> {
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

/**
 * Validates an array of XLSX student data against the Zod schema.
 * @param XLSXstudents - Array of student data from Excel import.
 * @throws {ZodError} If validation fails, throws a Zod error with detailed issues.
 * @remarks
 * - Uses `newXLSXStudentSchema` as the base schema.
 * - Extends the schema to optionally include an `id` field.
 * - Validates the entire array using `z.array()`.
 * - Throws synchronously if validation fails.
 * @example
 * ```typescript
 * try {
 *   validateXLSXStudentData(importedData);
 *   // Proceed with processing validated data
 * } catch (error) {
 *   if (isZodValidationError(error)) {
 *     const toast = zodIssuesToToastMessage(error.issues, "فشل التحقق من البيانات");
 *     toastService.show(toast);
 *   }
 * }
 * ```
 */
export const ValidateXLSXStudents = (
  XLSXstudents: NewXLSXStudent[] | XLSXStudent[],
) => {
  const { newXLSXStudentSchema } = studentSchemas;

  const XLSXStudentsSchema = z.array(
    newXLSXStudentSchema.extend({ id: z.number().optional() }),
  );
  XLSXStudentsSchema.parse(XLSXstudents);
};

const isExistingStudent = (
  student: XLSXStudent | NewXLSXStudent,
): student is XLSXStudent =>
  "id" in student && typeof student["id"] === "number";

/**
 * Groups XLSX student data into existing and new students based on presence of an ID.
 * @param XLSXStudents - Array of student data from Excel import.
 * @returns An object containing:
 * - `newStudents`: Students without an ID (new records).
 * - `existingStudents`: Students with an ID (existing records).
 * @remarks
 * Uses `isExistingStudent` type guard which checks for a numeric `id` property.
 * Students with `id` are considered possible existing (since the user may handwrite an IS); all others are treated as new.
 * @example
 * ```typescript
 * const students = [
 *   { first_name: "Ahmed", last_name: "Ali" }, // New student
 *   { id: 123, first_name: "Sara", last_name: "Mohamed" } // Existing student
 * ];
 * const { newStudents, existingStudents } = groupStudentsByExistence(students);
 * console.log(`New: ${newStudents.length}, Existing: ${existingStudents.length}`);
 * ```
 */
export const groupStudentsByExistence = (
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

/*=========== Possible new students logic ==========*/

/**
 * Formats new XLSX student data into NewStudent objects ready for database creation.
 * @param newXLSXStudents - Array of new students from Excel import (without IDs).
 * @param classId - The class ID to assign to all new students.
 * @returns An array of NewStudent objects ready for insertion.
 * @remarks
 * - Converts `birth_date` from Date to timestamp (getTime()).
 * - Sets default status to "active".
 * - Sets `exited_at` to null.
 * - Assigns the provided class ID to all students.
 * @example
 * ```typescript
 * const newStudents = [
 *   { first_name: "Ahmed", last_name: "Ali", birth_date: new Date("2000-01-15") }
 * ];
 * const formatted = formatNewStudentsForCreation(newStudents, 5);
 * // Returns: [{ first_name: "Ahmed", last_name: "Ali", birth_date: 946684800000, status: "active", exited_at: null, class_id: 5 }]
 * ```
 */
export const formatPossibleNewStudents = (
  newXLSXStudents: NewXLSXStudent[],
  classId: number,
) => {
  const newStudents: NewStudent[] = newXLSXStudents.map((st) => {
    return {
      ...st,
      birth_date: st.birth_date.getTime(),
      status: "active",
      exited_at: null,
      class_id: classId,
    };
  });
  return newStudents;
};

/*=========== Possible Existing students logic ==========*/

/**
 * Categorizes existing XLSX students into update, removal, and transfer candidates.
 * @param existingStudents - Array of XLSX students with IDs (from Excel).
 * @param students - Array of current students in the selected class.
 * @returns An object containing:
 * - `editStudents`: Students with field changes that need updating.
 * - `transferCandidates`: Students in Excel not found in the current class (may need transfer).
 * - `toRemoveCandidates`: Students in the class not present in Excel (may need removal).
 * @remarks
 *  *  It groups XLSXStudents (with ids) into : update - remove candidates - transfer candidates
 *      if exists in the selected class : update
 *      if he is in the class but not in excel : the user may want to delete him
 *      if he is in the Excel but not in class : the user may want to transfer him from another class
 * @example
 * ```typescript
 * const { editStudents, transferCandidates, toRemoveCandidates } =
 *   categorizeExistingStudentsByAction(excelStudents, classStudents);
 * // editStudents: [{ id: 1, first_name: "Updated Name" }]
 * // transferCandidates: [{ id: 2, first_name: "Ahmed" }] // Not in this class
 * // toRemoveCandidates: [{ id: 3, first_name: "Sara" }] // In class but not Excel
 * ```
 */
export const groupPossibleExistingStudents = (
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

/**
 * Categorizes transfer candidates into valid transfers and non-existent students.
 * @param XLSXStudents - Array of XLSX students flagged for transfer.
 * @param studentMap - Map of student IDs to Student objects (from all classes).
 * @returns An object containing:
 * - `trueTransferCandidates`: Students found in the map (valid for transfer).
 * - `trueTransferCandidatesChangesMap`: Map of changes to apply during transfer.
 * - `NonexistentStudents`: Students not found in the map (don't exist in DB).
 * @remarks
 * - It groups Transfer XLSXStudents  into : validated transfer candidates - nonexistent
 *      If the students is found in the students Map : he exists So update it with its class_id
 *      if the students is not found in the students Map : the user doesn't exist in the DB
 * @example
 * ```typescript
 * const studentMap = new Map([[1, student1], [2, student2]]);
 * const { trueTransferCandidates, NonexistentStudents } =
 *   categorizeTransferCandidates(transferStudents, studentMap);
 * // trueTransferCandidates: [student1, student2]
 * // NonexistentStudents: [{ id: 3, first_name: "Unknown" }]
 * ```
 */
export const groupPossibleTransferStudents = (
  XLSXStudents: XLSXStudent[],
  studentMap: Map<number, Student>,
) => {
  const NonexistentStudents: XLSXStudent[] = [];
  const trueTransferCandidates: Student[] = [];
  const trueTransferCandidatesChangesMap: Map<
    number,
    Partial<ActiveStudent>
  > = new Map();

  XLSXStudents.forEach((XLSXStudent) => {
    const foundStudent = studentMap.get(XLSXStudent.id);
    if (foundStudent) {
      const changesInStudent: Partial<ActiveStudent> = {
        ...getChangesInStudent(foundStudent, XLSXStudent),
      };
      trueTransferCandidatesChangesMap.set(XLSXStudent.id, changesInStudent);
      trueTransferCandidates.push({
        ...foundStudent,
        first_name: XLSXStudent.first_name,
        last_name: XLSXStudent.last_name,
      });
    } else {
      NonexistentStudents.push(XLSXStudent);
    }
  });
  return {
    trueTransferCandidates,
    trueTransferCandidatesChangesMap,
    NonexistentStudents,
  };
};

/**
 * Compares an Excel student with the database record and returns only changed fields.
 * @param existingStudent - The student record from the database.
 * @param XLSXStudent - The student data from Excel.
 * @returns An object with changed fields, or `undefined` if no changes detected.
 * @remarks
 * - Converts XLSXStudent birth_date to timestamp for comparison.
 * - Compares all fields in the student object.
 * @internal
 * @example
 * ```typescript
 * const dbStudent = { id: 1, first_name: "Ahmed", last_name: "Ali", birth_date: 946684800000 };
 * const excelStudent = { id: 1, first_name: "Ahmed", last_name: "Mohamed", birth_date: new Date("2000-01-15") };
 * const changes = getStudentFieldChanges(dbStudent, excelStudent);
 * // Returns: { last_name: "Mohamed" }
 * ```
 */
const getChangesInStudent = (
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
