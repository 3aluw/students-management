import db from "~/db/db";


export default defineEventHandler((event) => {
  const query = getQuery<{ id: string }>(event);
  if (!query.id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Class ID is required",
    });
  }
  const classId = query.id;
  const stmt = db.prepare(`
    DELETE FROM class WHERE id = ?
    `);
  const result = stmt.run(classId);
if (result.changes > 0) {
  return { status: 200, message: 'تم حذف القسم' };
} else {
  return { status: 404, message: 'لم يتم إيجاد القسم' };
}
})
