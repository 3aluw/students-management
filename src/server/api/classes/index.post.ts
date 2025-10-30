import type { Class } from '~/data/types';
import db from '~/db/db';

export default defineEventHandler(async (event) => {
  const {id,level,abbreviation} = await readBody<Class>(event) ;
  const stmt = db.prepare('INSERT INTO student (id,level,abbreviation) VALUES (?, ?, ?)');
  const info = stmt.run(id,level,abbreviation);

  return { success: true, id: info.lastInsertRowid, info };
});
