import { join } from "path";
import Database from "better-sqlite3";

// Create or connect to the database
const dbPath = join(process.cwd(), "src/db/mydb.sqlite");

const db = new Database(dbPath);

// Example: create a table if it doesn't exist

 //Create class table if not existent 
db.prepare(`
  CREATE TABLE IF NOT EXISTS class (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grade INT NOT NULL,
    school_level TEXT NOT NULL,
    section TEXT NOT NULL,
    UNIQUE (school_level, grade, section)
  )
`).run(); 

  
//Create student table if not existent
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS student (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    father_name TEXT NOT NULL,
    grandfather_name TEXT NOT NULL,
    sex TEXT NOT NULL CHECK (sex IN ('M', 'F')) DEFAULT 'M',
    phone_number TEXT NOT NULL,
    birth_date INT NOT NULL,
    address TEXT NOT NULL,
    FOREIGN KEY (class_id) REFERENCES class(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
    UNIQUE (first_name, last_name, father_name, grandfather_name, birth_date)
  )
`
).run();
 

 db.prepare(
  `
  CREATE TABLE IF NOT EXISTS lateness (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    date INTEGER NOT NULL,
    enter_time NOT NULL,
    lateBy INT NOT NULL,
    reason TEXT,
    reason_accepted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (student_id) REFERENCES student(id),
    UNIQUE(student_id, date, enter_time)
  )
`
).run(); 


db.prepare(
  `
  CREATE TABLE IF NOT EXISTS absence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    date INTEGER NOT NULL,
    reason TEXT,
    reason_accepted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (student_id) REFERENCES student(id),
    UNIQUE(student_id, date)
  )
`
).run();

/* 
// DROP TABLES
 db.prepare('DROP TABLE class').run()
db.prepare('DROP TABLE student').run()
db.prepare('DROP TABLE Lateness').run()
db.prepare('DROP TABLE absence').run() */

export default db;
