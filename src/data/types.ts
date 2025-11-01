export type NewEntity<T extends { id: any }> = Omit<T, 'id'>;
/**
 * Represents a row in the `class` table.
 */
export interface Class {
  id: number;            // PRIMARY KEY AUTOINCREMENT
  level: number;         // INT NOT NULL
  abbreviation: string;  // TEXT NOT NULL
}

/**
 * Represents a row in the `student` table.
 */
export interface Student {
  id: number;                // PRIMARY KEY AUTOINCREMENT
  class_id: number;   // FOREIGN KEY -> class.id (nullable)
  first_name: string;        // TEXT NOT NULL
  last_name: string;         // TEXT NOT NULL
  father_name: string;       // TEXT NOT NULL
  grandfather_name: string;  // TEXT NOT NULL
  sex: Gender;            // CHECK (sex IN ('M', 'F')) DEFAULT 'M'
  phone_number: string;      // TEXT NOT NULL
  birth_date: number;        // INT (timestamp)
  address: string;           // TEXT NOT NULL
}

/**
 * Represents a row in the `Lateness` table.
 */
export interface Lateness {
  id: number;                  // PRIMARY KEY AUTOINCREMENT
  student_id: number;          // FOREIGN KEY -> student.id
  date: number;                // INT (timestamp)
  enter_time: string | number; // unspecified type in schema, use string or number depending on storage
  lateBy: number;              // INT NOT NULL (minutes, presumably)
  reason: string | null;       // TEXT (nullable)
  reason_accepted: boolean;    // BOOLEAN DEFAULT FALSE
}

/**
 * Represents a row in the `absence` table.
 */
export interface Absence {
  id: number;               // PRIMARY KEY AUTOINCREMENT
  student_id: number;       // FOREIGN KEY -> student.id
  date: number;             // INT (timestamp)
  reason: string | null;    // TEXT (nullable)
  reason_accepted: boolean; // BOOLEAN DEFAULT FALSE
}


export type NewStudent = NewEntity<Student>;
export type NewClass = NewEntity<Class>;
export type NewLateness = NewEntity<Lateness>;
export type NewAbsence = NewEntity<Absence>;

export type Gender = 'M' | 'F';