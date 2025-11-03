import db from "~/db/db";
import type { Student } from "~/data/types";

export default defineEventHandler((event) => {
  const query = getQuery<{ classId: string }>(event);
  
  if (!query.classId) {
    const stmt = db.prepare("SELECT * FROM student LIMIT 300");
    const students = stmt.all();
    return students as Student[];
  }

   const stmt = db.prepare("SELECT * FROM student WHERE class_id = ?");
    const students = stmt.all(query.classId);
    return students as Student[];
});
