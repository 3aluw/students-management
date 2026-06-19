import { join } from "path";
import Database from "better-sqlite3";

// Create or connect to the database
const dbPath = join(process.cwd(), "src/db/db.sqlite");

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
    class_id INTEGER,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    father_name TEXT NOT NULL,
    grandfather_name TEXT NOT NULL,
    sex TEXT NOT NULL CHECK (sex IN ('M', 'F')) DEFAULT 'M',
    phone_number TEXT NOT NULL,
    birth_date INT NOT NULL,
    address TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'graduated' , 'dropped' , 'transferred')) DEFAULT 'active',
    exited_at INT DEFAULT NULL,
    CHECK (
    (status = 'active' AND exited_at IS NULL AND class_id IS NOT NULL) OR 
    (status != 'active' AND exited_at IS NOT NULL AND class_id IS NULL)
     )
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
    start_time INTEGER NOT NULL,
    late_by INT NOT NULL,
    reason TEXT,
    reason_accepted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (student_id) REFERENCES student(id),
    UNIQUE(student_id, date, late_by, start_time)
  )
`
).run();


db.prepare(
  `
  CREATE TABLE IF NOT EXISTS absence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    date INTEGER NOT NULL,
    start_time INTEGER NOT NULL,
    reason TEXT,
    reason_accepted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (student_id) REFERENCES student(id),
    UNIQUE(student_id, date)
  )
`
).run();

db.prepare(
  `
CREATE TABLE IF NOT EXISTS season (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  terms TEXT NOT NULL -- JSON array of SchoolTerm objects
   CHECK (json_valid(terms)) 
);
`
).run();


/* db.prepare(`
INSERT INTO student (
  class_id, first_name, last_name, father_name, grandfather_name,
  sex, phone_number, birth_date, address, status, exited_at
) VALUES
(1, 'أحمد', 'العسري', 'محمد', 'عبدالله', 'M', '0612345678', 1579046400000, 'الرباط', 'active', NULL),
(1, 'سارة', 'الطاهري', 'خالد', 'يوسف', 'F', '0611122233', 1584758400000, 'الدار البيضاء', 'active', NULL),
(1, 'مروان', 'بن علي', 'سعيد', 'عبد الكريم', 'M', '0678901234', 1591747200000, 'مراكش', 'active', NULL),
(1, 'ليلى', 'المغربي', 'حسن', 'عبد القادر', 'F', '0698765432', 1599436800000, 'فاس', 'active', NULL),
(1, 'يوسف', 'العمري', 'إدريس', 'مصطفى', 'M', '0654321987', 1606694400000, 'طنجة', 'active', NULL),

(2, 'خديجة', 'السباعي', 'أمين', 'عبدالسلام', 'F', '0645678123', 1611619200000, 'القنيطرة', 'active', NULL),
(2, 'عمر', 'العربي', 'سليمان', 'الحسين', 'M', '0667890123', 1614988800000, 'سلا', 'active', NULL),
(2, 'نور', 'بن صالح', 'كمال', 'عبدالرحيم', 'F', '0634567890', 1617753600000, 'مكناس', 'active', NULL),
(2, 'أنس', 'الزهراء', 'طارق', 'عبد الجليل', 'M', '0610987654', 1619827200000, 'أكادير', 'active', NULL),
(2, 'هبة', 'العلوي', 'نزار', 'عبد المجيد', 'F', '0623456789', 1623974400000, 'وجدة', 'active', NULL);
`).run();
 */

 
// DROP TABLES
//db.prepare('DROP TABLE class').run()
//db.prepare('DROP TABLE student').run()
//db.prepare('DROP TABLE Lateness').run()
//db.prepare('DROP TABLE absence').run() 

export default db;
