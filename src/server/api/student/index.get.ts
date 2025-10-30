import db from '~/db/db';

export default defineEventHandler(() => {
  const stmt = db.prepare('SELECT * FROM student');
  const students = stmt.all();
  console.log('students: ', students);
  return students;
});

