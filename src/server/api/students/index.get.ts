import db from '~/db/db';
import type { Student } from '~/data/types';

export default defineEventHandler(() => {
  const stmt = db.prepare('SELECT * FROM student');
  const students = stmt.all();
  console.log('students: ', students);
  return students as Student[];
});

