import { Student } from '~/data/types';
import db from '~/db/db';

export default defineEventHandler(async (event) => {
  const {first_name, last_name, father_name,grandfather_name, sex, phone_number, birth_date, address} = await readBody<Student>(event) ;
  const stmt = db.prepare('INSERT INTO student (first_name, last_name, father_name,grandfather_name, sex, phone_number, birth_date, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(first_name, last_name, father_name,grandfather_name, sex, phone_number, birth_date, address);

  return { success: true, id: info.lastInsertRowid, info };
});
