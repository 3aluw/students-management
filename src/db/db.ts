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
    reason TEXT,
    reason_accepted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (student_id) REFERENCES student(id),
    UNIQUE(student_id, date)
  )
`
).run();


/* db.prepare(
    `INSERT INTO student (
  class_id, first_name, last_name, father_name, grandfather_name,
  sex, phone_number, birth_date, address
) VALUES
(1, 'أحمد', 'العسري', 'محمد', 'عبدالله', 'M', '0612345678', 20090115, 'الرباط'),
(1, 'سارة', 'الطاهري', 'خالد', 'يوسف', 'F', '0611122233', 20100421, 'الدار البيضاء'),
(1, 'مروان', 'بن علي', 'سعيد', 'عبد الكريم', 'M', '0678901234', 20081210, 'مراكش'),
(1, 'ليلى', 'المغربي', 'حسن', 'عبد القادر', 'F', '0698765432', 20091107, 'فاس'),
(1, 'يوسف', 'العمري', 'إدريس', 'مصطفى', 'M', '0654321987', 20080130, 'طنجة'),

(2, 'خديجة', 'السباعي', 'أمين', 'عبدالسلام', 'F', '0645678123', 20090225, 'القنيطرة'),
(2, 'عمر', 'العربي', 'سليمان', 'الحسين', 'M', '0667890123', 20080514, 'سلا'),
(2, 'نور', 'بن صالح', 'كمال', 'عبدالرحيم', 'F', '0634567890', 20090312, 'مكناس'),
(2, 'أنس', 'الزهراء', 'طارق', 'عبد الجليل', 'M', '0610987654', 20100105, 'أكادير'),
(2, 'هبة', 'العلوي', 'نزار', 'عبد المجيد', 'F', '0623456789', 20090618, 'وجدة');
`
).run() */

/* 
// DROP TABLES
 db.prepare('DROP TABLE class').run()
db.prepare('DROP TABLE student').run()
db.prepare('DROP TABLE Lateness').run()
db.prepare('DROP TABLE absence').run() */

export default db;
