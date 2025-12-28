/**
 * Utility types
 */
export type NewEntity<T extends { id: any }> = Omit<T, "id">;
type PartialExceptId<T extends { id: number }> = Partial<Omit<T, "id">> &
  Pick<T, "id">;
type BatchEdit<T extends AllEntitiesUnion> = Partial<Omit<T, "id">> & {
  ids: number[];
};

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
export interface Student {
  id: number; // PRIMARY KEY AUTOINCREMENT
  class_id: number; // FOREIGN KEY -> class.id (nullable)
  first_name: string; // TEXT NOT NULL
  last_name: string; // TEXT NOT NULL
  father_name: string; // TEXT NOT NULL
  grandfather_name: string; // TEXT NOT NULL
  sex: Gender; // CHECK (sex IN ('M', 'F')) DEFAULT 'M'
  phone_number: string; // TEXT NOT NULL
  birth_date: number; // INT (timestamp)
  address: string; // TEXT NOT NULL
}

/**
 * Represents a row in the `Lateness` table.
 */
export interface Lateness {
  id: number; // PRIMARY KEY AUTOINCREMENT
  student_id: number; // FOREIGN KEY -> student.id
  date: number; // INT (timestamp)
  start_time:  number; // session start time (minutes since midnight)
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
  start_time:  number; // session start time (minutes since midnight)
  reason: string | null; // TEXT (nullable)
  reason_accepted: 1 | 0; // BOOLEAN DEFAULT FALSE
}





export interface SchoolSeason {
  id: number;
  name: string;
  terms: SchoolTerm[];
}

 interface SchoolTerm {
  name: string;
  startDate: number;
  endDate: number;
}

export type AllEntitiesUnion = Student | Class | Absence | Lateness;

export type NewStudent = NewEntity<Student>;
export type NewClass = NewEntity<Class>;
export type NewLateness = NewEntity<Lateness>;
export type NewAbsence = NewEntity<Absence>;

export type EditStudent = PartialExceptId<Student>;
export type EditClass = PartialExceptId<Class>;
export type EditLateness = PartialExceptId<Lateness>;
export type EditAbsence = PartialExceptId<Absence>;

export type BatchEditStudent = BatchEdit<Student>;
export type BatchEditAbsence = BatchEdit<Absence>;
export type BatchEditLateness = BatchEdit<Lateness>;

export type AbsenceInfo = Omit<Absence, "student_id" | 'id'>
export type LatenessInfo  = Omit<Lateness, "student_id" | 'id'>

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

export type SupportedDateRanges =
  | "today"
  | "yesterday"
  | "this week"
  | "this month";

  export type EventQueryFilters = Partial<{
    limit : number,
    offset : number,
    classId : number,
    name: string,
    minDate : number,
    maxDate : number
  }>

  export type PlaygroundSettings = {
    defaultStartTime: number;
    dynamicTime : boolean;        // if true, the start time will be set to the current time when registering the lateness
    defaultLateBy: number;       // in minutes, optional if dynamicTime is false
    fastMode : boolean;
    defaultReason : string;
    reasonAcceptedByDefault : 0 | 1;
  }