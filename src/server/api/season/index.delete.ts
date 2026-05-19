import db from "~/db/db";


export default defineEventHandler((event) => {
  const query = getQuery<{ id: string }>(event);
  if (!query.id) {
    throw createError({
      statusCode: 400,
      statusMessage: "لم يتم تحديد الموسم المراد حذفه",
    });
  }
  const seasonId = query.id;
  const stmt = db.prepare(`
    DELETE FROM season WHERE id = ?
    `);
  const result = stmt.run(seasonId);
if (result.changes > 0) {
  return { status: 200, message: 'تم حذف الموسم' };
} else {
  return { status: 404, message: 'لم يتم إيجاد الموسم' };
}
})
