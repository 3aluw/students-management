import db from "~/db/db";
import type { Student } from "~/data/types";

export default defineEventHandler((event) => {
  const { classId, name } = getQuery<{ classId?: string; name?: string }>(
    event
  );
  if (classId) {
    const stmt = db.prepare("SELECT * FROM student WHERE class_id = ?");
    const students = stmt.all(classId);
    return students as Student[];
  } else if (name) {
     const stmt = db.prepare("SELECT * FROM student WHERE (first_name || ' ' || last_name) LIKE ?");
    const students = stmt.all(`%${name}%`);
    return students as Student[];
  }
  const stmt = db.prepare("SELECT * FROM student LIMIT 300");
  const students = stmt.all();
  return students as Student[];
});
