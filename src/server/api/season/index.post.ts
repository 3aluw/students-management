import type {  EditSchoolSeason, NewSchoolSeason } from "~/data/types";
import db from "~/db/db";
import useDBUtils from "../../../composables/useDBUtils";

export default defineEventHandler(async (event) => {
  const { generateDBSetClause } = useDBUtils();

  const reqBody = await readBody<NewSchoolSeason | EditSchoolSeason >(event);
  const { grade, school_level, section } = reqBody;
  // if no id : Create a new item
  if (!("id" in reqBody)) {
    const stmt = db.prepare("INSERT INTO class (grade, school_level,section) VALUES (?, ?, ?)");
    const info = stmt.run(grade, school_level, section);
    return { success: true, id: info.lastInsertRowid, info };
  } // if id : item exists So update it
  else {
    const stringifiedTerms = JSON.stringify(reqBody.terms);
    const updatedReqBody = {
      ...reqBody,
      terms: stringifiedTerms,
    }
    const values = Object.values(updatedReqBody);
    const setClause = generateDBSetClause(updatedReqBody);
    const stmt = db.prepare(`UPDATE season SET ${setClause} WHERE id = ?`);
    const info = stmt.run(...values, reqBody.id);
    return { success: true, id: info.lastInsertRowid, info };
  }
});
