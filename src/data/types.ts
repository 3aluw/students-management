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
  enter_time: string | number; // unspecified type in schema, use string or number depending on storage
  lateBy: number; // INT NOT NULL (minutes, presumably)
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
  reason: string | null; // TEXT (nullable)
  reason_accepted: 1 | 0; // BOOLEAN DEFAULT FALSE
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

export type LocalAbsence = Absence & {
  first_name: string;
  last_name: string;
  class_id: number;
} & Omit<Class, "id">;

export type Gender = "M" | "F";
export type SchoolLevel = "primary" | "middle" | "high";

export type SupportedDateRanges =
  | "today"
  | "yesterday"
  | "this week"
  | "this month";
