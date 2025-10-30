import db from '~/db/db';

export default defineEventHandler(async () => {
  const stmt = db.prepare('INSERT INTO student (first_name, last_name, father_name, phone_number, birth_date, address) VALUES (?, ?, ?, ?, ?, ?)');
  const info = stmt.run('abdou', 'diop', 'mamadou', '1234567890', 946684800, '123 Main St');

  return { success: true, id: info.lastInsertRowid, info };
});
