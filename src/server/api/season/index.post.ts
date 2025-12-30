import type { Class } from "~/data/types";
import db from "~/db/db";
import useDBUtils from "../../../composables/useDBUtils";

export default defineEventHandler(async (event) => {
  const { generateDBSetClause } = useDBUtils();

  const reqBody = await readBody<Class>(event);
  const { grade, school_level, section, id } = reqBody;
  // if no id : Create a new item
  if (!id) {
    const stmt = db.prepare("INSERT INTO class (grade, school_level,section) VALUES (?, ?, ?)");
    const info = stmt.run(grade, school_level, section);
    return { success: true, id: info.lastInsertRowid, info };
  } // if id : item exists So update it
  else {
    const values = Object.values(reqBody);
    
    const setClause = generateDBSetClause(reqBody);
    const stmt = db.prepare(`UPDATE class SET ${setClause} WHERE id = ?`);
    const info = stmt.run(...values, reqBody.id);
    return { success: true, id: info.lastInsertRowid, info };
  }
});
