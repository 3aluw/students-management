import type { ZodError } from "zod";
import { ArabicXLSXcAbsenceProperties, ArabicXLSXLatenessProperties, ArabicXLSXStudentProperties } from "./static";
/**
 * Utility types
 */
export type NewEntity<T extends { id: any }> = Omit<T, "id">;

type PartialExceptId<T extends { id: number }> = T extends any ? Partial<Omit<T, "id">> &
  Pick<T, "id"> : never;

type BatchEdit<T extends AllEntitiesUnion> =
  T extends any
  ? {
    ids: number[];
  } & Partial<Omit<T, "id">>
  : never;

export type DataTableSlot<T> = { data: T };

//     Entities Types
/**
 * Represents a row in the `class` table.
 */
export interface Class {
  id: number;
  grade: number;
  school_level: SchoolLevel;
  section: string;
}

/**
 * Represents a row in the `student` table.
 */

type InactiveStudentStatus =
  | "graduated"
  | "dropped"
  | "transferred";

export interface BaseStudent {
  id: number; // PRIMARY KEY AUTOINCREMENT
  first_name: string; // TEXT NOT NULL
  last_name: string; // TEXT NOT NULL
  father_name: string; // TEXT NOT NULL
  grandfather_name: string; // TEXT NOT NULL
  sex: Gender;  // CHECK (sex IN ('M', 'F')) DEFAULT 'M'
  phone_number: string; // TEXT NOT NULL
  birth_date: number; // INT (timestamp)
  address: string; // TEXT NOT NULL
}

export interface ActiveStudent extends BaseStudent {
  status: "active";

  class_id: number;

  exited_at?: null;
}

export interface InactiveStudent extends BaseStudent {
  status: InactiveStudentStatus;

  class_id: null;

  exited_at: number;
}
/**
 * Represents a row in the `Student` table.
 */
export type Student = ActiveStudent | InactiveStudent;


/**
 * Represents a row in the `Lateness` table.
 */
export interface Lateness {
  id: number; // PRIMARY KEY AUTOINCREMENT
  student_id: number; // FOREIGN KEY -> student.id
  date: number; // INT (timestamp)
  start_time: number; // session start time (minutes since midnight)
  late_by: number; // INT NOT NULL (minutes, presumably)
  reason: string | null; // TEXT (nullable)
  reason_accepted: 1 | 0; // BOOLEAN DEFAULT FALSE
}

/**
 * Represents a row in the `absence` table.
 */
export interface Absence {
  id: number; // PRIMARY KEY AUTOINCREMENT
  student_id: number; // FOREIGN KEY -> student.id
  date: number; // INT (timestamp)
  start_time: number; // session start time (minutes since midnight)
  reason: string | null; // TEXT (nullable)
  reason_accepted: 1 | 0; // BOOLEAN DEFAULT FALSE
}

export interface SchoolSeason {
  id: number;
  name: string;
  terms: SchoolTerm[];
}

export interface SchoolTerm {
  name: string;
  startDate: number;
  endDate: number;
}

export type AllEntitiesUnion = Student | Class | Absence | Lateness | SchoolSeason;
export type AllEntitiesKeys = keyof (Student & Class & Absence & Lateness & SchoolSeason & SchoolTerm)

export type NewStudent = NewEntity<ActiveStudent>;
export type NewClass = NewEntity<Class>;
export type NewLateness = NewEntity<Lateness>;
export type NewAbsence = NewEntity<Absence>;
export type NewSchoolSeason = NewEntity<SchoolSeason>;

export type EditStudent = PartialExceptId<Student>;
export type EditClass = PartialExceptId<Class>;
export type EditLateness = PartialExceptId<Lateness>;
export type EditAbsence = PartialExceptId<Absence>;
export type EditSchoolSeason = PartialExceptId<SchoolSeason>;

export type BatchEditStudent = BatchEdit<Student>;
export type BatchEditAbsence = BatchEdit<Absence>;
export type BatchEditLateness = BatchEdit<Lateness>;


export type AbsenceInfo = Omit<Absence, "student_id" | "id">;
export type LatenessInfo = Omit<Lateness, "student_id" | "id">;

export type LocalAbsence = Absence & {
  first_name: string;
  last_name: string;
  class_id: number;
} & Omit<Class, "id">;
export type LocalLateness = Lateness & {
  first_name: string;
  last_name: string;
  class_id: number;
} & Omit<Class, "id">;

export type EventTypes = "lateness" | "absence";
export type Gender = "M" | "F";
export type SchoolLevel = "primary" | "middle" | "high";
export type StudentStatus = 'active' | 'graduated' | 'dropped' | 'transferred'
export type SeasonStatus = "past" | "current" | "future";
export type SupportedDateRanges =
  | "today"
  | "yesterday"
  | "this week"
  | "this month";



export type PlaygroundSettings = {
  defaultStartTime: number;
  dynamicTime: boolean; // if true, the start time will be set to the current time when registering the lateness
  defaultLateBy: number; // in minutes, optional if dynamicTime is false
  fastMode: boolean;
  defaultReason: string;
  reasonAcceptedByDefault: 0 | 1;
};

// ========== SEASONS TYPES ==========
export type ClassPromotionMap = Record<string, number>;

export type NewSeasonPayload = {
  terminateCurrentSeason: boolean;
  newSeason: NewSchoolSeason;
  classPromotionMap: ClassPromotionMap
  repeaters: Student["id"][];
};

// ========== BACKEND ERROR TYPES ==========

type BackendBaseError = {
  statusCode: number,
  message: string,
}
export type BackendValidationError = BackendBaseError & {
  data: {
    issues: ZodError["issues"]
  }
}
// ============== Ui types====================
/** 
*Used in class/gender options...
**/
export type Option<T = number> = {
  label: string;
  value: T;
};


// ============== Query types====================
export type InactiveStudentQueryFilters = {
  name?: string,
  status: Exclude<StudentStatus, "active">
  exited_at_Year?: number
}
export type ActiveStudentQueryFilters = {
  name?: string,
  class_id?: number,
  status: Extract<StudentStatus, "active">,
}
export type StudentsQueryFilters = ActiveStudentQueryFilters | InactiveStudentQueryFilters

export type EventQueryFilters = Partial<{
  limit: number;
  offset: number;
  classId: number;
  name: string;
  minDate: number;
  maxDate: number;
}>;


// ============== XLSX types ====================

/*Utility types: used mainly for excel language transformations but can be used for other language transformation */

/**
 * Generic property-mapping dictionary type.
 * @typeParam T - The object type to extract keys from.
 * @example
 * ```typescript
 * type ArabicXLSXStudentProperties = PropDict<XLSXStudent> // gives typeof XLSXArabicStudentPropertie
 * ```
 */
export type PropDict<T> = Record<keyof T, string>;

/**
 * Generic key extractor.
 * @typeParam T - The object type to extract keys from.
 * @example
 * ```typescript
 * type arabicStudentProps = ArabicKeysOf<typeof ArabicStudentProperties> // gives "المعرف" | "الحالة" | "الاسم" | "اللقب" | "اسم الأب" | "اسم الجد" | "الصف" | "الجنس" | "رقم الهاتف" | "تاريخ الميلاد" | "العنوان" | "تاريخ المغادرة"
 * ```
 */
export type ArabicKeysOf<Dict> = Dict[keyof Dict];

/**
 * Generic Arabic-keyed type, derived from any source type T and its dict.
 * @typeParam T - The object type to extract keys from.
 * @typeParam Dict - The dictionary that holds T keys. (So we can map using it)
 * @example
 * ```typescript
 * type arabicStufdent : InArabic<XLSXStudent, typeof ArabicXLSXStudentProperties> // gives XLSXStudent but with Arabic keys
 * ```
 */

export type InArabic<T, Dict extends PropDict<T>> = {
  [K in keyof T as Dict[K]]: T[K];
};

/* XLSX student and events' types */
export type XLSXStudent = Omit<Student, "status" | "class_id" | "exited_at" | "birth_date"> & {
  birth_date: Date
}
export type XLSXAbsnece = Omit<LocalAbsence, "id" | "student_id" | "date" | "start_time" | "reason_accepted" | "section" | "class_id" | "grade" | "school_level"> & {
  class: string,
  date: Date,
  reason_accepted: boolean,
}
export type XLSXLateness = Omit<LocalLateness, "id" | "student_id" | "date" | "start_time" | "reason_accepted" | "section" | "class_id" | "grade" | "school_level"> & {
  class: string,
  date: Date,
  reason_accepted: boolean,
}

export type XLSXType = XLSXAbsnece | XLSXLateness | XLSXStudent
export type ArabicXLSXType = InArabic<XLSXAbsnece, typeof ArabicXLSXcAbsenceProperties> | InArabic<XLSXLateness, typeof ArabicXLSXLatenessProperties> | InArabic<XLSXStudent, typeof ArabicXLSXStudentProperties>




