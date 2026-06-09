import { BatchEditStudent, ClassPromotionMap, EditStudent, NewStudent, Student } from "~/data/types";
import db from "~/db/db";
import { seasonService } from "../services/seasonService";


export const studentRepo = {
  getAll(limit = 300): Student[] {
    const stmt = db.prepare("SELECT * FROM student LIMIT ?");
    const students = stmt.all(limit);
    return students as Student[];
  },
  findByClassId(classId: number): Student[] {
    const stmt = db.prepare("SELECT * FROM student WHERE class_id = ?");
    const students = stmt.all(classId);
    return students as Student[];
  },
  findByName(name: string): Student[] {
    const stmt = db.prepare(
      "SELECT * FROM student WHERE (first_name || ' ' || last_name) LIKE ?",
    );
    const students = stmt.all(`%${name}%`);
    return students as Student[];
  },
  deleteStudentsByIds(studentIds: number[]) {
    const inClause = generateDBInClause(studentIds.length);
    const stmt = db.prepare(`DELETE FROM student WHERE id IN (${inClause})`);
    return stmt.run(...studentIds);
  },
  createStudent(studentData: NewStudent) {
    const {
      first_name,
      last_name,
      class_id,
      father_name,
      grandfather_name,
      sex,
      phone_number,
      birth_date,
      address,
    } = studentData;
    const stmt = db.prepare(
      "INSERT INTO student (class_id, first_name, last_name, father_name,grandfather_name, sex, phone_number, birth_date, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const result = stmt.run(
      class_id,
      first_name,
      last_name,
      father_name,
      grandfather_name,
      sex,
      phone_number,
      birth_date,
      address,
    );
    return result

  },
  updateStudent(studentData: EditStudent) {
    const values = Object.values(studentData);
    const setClause = generateDBSetClause(studentData);
    const stmt = db.prepare(`UPDATE student SET ${setClause} WHERE id = ?`);
    const result = stmt.run(...values, studentData.id);
    return result;
  },

  updateStudents(studentsData: BatchEditStudent) {
    const { ids, ...props } = studentsData;
    const values = Object.values(props);
    const inClause = generateDBInClause(ids.length);
    const setClause = generateDBSetClause(props);
    const stmt = db.prepare(
      `UPDATE student SET ${setClause} WHERE id IN (${inClause}) `
    );
    const result = stmt.run(...values, ...ids);
    return result
  },

  async handlesStudentsPromotion(
    promotionMap: ClassPromotionMap,
    repeatersIds: number[],
  ) {
    // ==========  promote students while ignoring the repeaters & managing the graduating ones ==========

    // get graduating classes then write them in this sql syntax (1, 4)
    const graduatingClassIds = Object.entries(promotionMap)
      .filter(([from, to]) => to === -1)
      .map(([from, to]) => Number(from));
    const formattedGraduatingClassIds = generateSqlCTEValues(
      graduatingClassIds,
      1,
    );
    // get last season end date to set it as exited_at for garuating students
    const exited_at = seasonService.lastSeasonEndDate() ?? new Date().setHours(24, 0, 0, 0)
    const formattedExited_at = generateSqlCTEValues([exited_at], 1)

    // get pure promotion map (without graduating classes) then write them in this sql syntax  (1, 4)
    const purePromotionMap = Object.entries(promotionMap).filter(
      ([from, to]) => to !== -1,
    );
    const formattedPromotionMap = generateSqlCTEValues(purePromotionMap, 2);

    //transform the repeater ids to this syntax (101), (205), (309)for sql query
    const formattedRepeatersIds = generateSqlCTEValues(repeatersIds, 1);

    const sql = `
WITH 
graduatingClassIds(class_id) AS (
  VALUES ${formattedGraduatingClassIds}
),
promotion_map(from_class_id, to_class_id) AS (
  VALUES ${formattedPromotionMap}
),
exit_dates(exit_date) AS (
  VALUES ${formattedExited_at}
),
repeaters(student_id) AS (
  VALUES ${formattedRepeatersIds}
)

UPDATE student
SET 
  class_id = CASE
    WHEN id IN (SELECT student_id FROM repeaters) THEN class_id
    WHEN class_id IN (SELECT class_id FROM graduatingClassIds) THEN NULL
    ELSE (
      SELECT to_class_id
      FROM promotion_map
      WHERE from_class_id = student.class_id
    )
  END,

  status = CASE
    WHEN id IN (SELECT student_id FROM repeaters) THEN status
    WHEN class_id IN (SELECT class_id FROM graduatingClassIds) THEN 'graduated'
    ELSE status
  END,

  exited_at = CASE
    WHEN id IN (SELECT student_id FROM repeaters) THEN exited_at
    WHEN class_id IN (SELECT class_id FROM graduatingClassIds)
      THEN (SELECT exit_date FROM exit_dates LIMIT 1)
    ELSE exited_at
  END

  WHERE 
    class_id IN (SELECT class_id FROM graduatingClassIds)
    OR class_id IN (SELECT from_class_id FROM promotion_map);
`;
    db.exec(sql);

  },
};
