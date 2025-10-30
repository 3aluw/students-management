import db from '~/db/db';
import type { Class } from '~/data/types';

export default defineEventHandler(() => {
  const stmt = db.prepare('SELECT * FROM class');
  const classes = stmt.all();
  console.log('classes: ', classes);
  return classes as Class[];
});

