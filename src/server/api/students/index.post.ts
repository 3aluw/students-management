import { EditStudent, BatchEditStudent, NewStudent } from "~/data/types";
import db from "~/db/db";
import useDBUtils from "../../../composables/useDBUtils";
import { studentService } from "~/server/services/studentService";
import type { H3Error } from "h3";

export default defineEventHandler(async (event) => {
  const { generateDBSetClause, generateDBInClause, logError } = useDBUtils();

  const reqBody = await readBody<NewStudent | EditStudent | BatchEditStudent>(
    event
  );
  if ("ids" in reqBody) {
    try {
      const { ids, ...props } = reqBody;
      const values = Object.values(props);
      const inClause = generateDBInClause(ids.length);
      const setClause = generateDBSetClause(props);
      const stmt = db.prepare(
        `UPDATE student SET ${setClause} WHERE id IN (${inClause}) `
      );
      const info = stmt.run(...values, ...ids);
      return { success: true, id: info.lastInsertRowid, info };
    } catch (err) {
      throw createError({
        statusCode: 400,
        statusMessage: (err as Error).message || "لم يتم تعديل معلومات الطلاب",
      });
    }
  }

  
  // if no id : Create a new item
  if (!("id" in reqBody)) {
    try {
      return studentService.createStudent(reqBody);
    }
    catch (error) {
      logError("Error creating student:", error, event.path, reqBody);
      return sendError(event, error as H3Error);
    }
  } 
  
  // if id : item exists So update it
  else {
    try {
       return studentService.updateStudent(reqBody);
    } catch (err) {
      logError("Error updating student:", err, event.path, reqBody);
      return { success: false, error: (err as Error).message };
    }
  }
});
