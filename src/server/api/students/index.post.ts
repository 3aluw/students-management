import { Student } from "~/data/types";
import db from "~/db/db";
import useDBUtils from "../../../composables/useDBUtils";

export default defineEventHandler(async (event) => {
  const { generateDBSetClause } = useDBUtils();

  const reqBody = await readBody<Student>(event);
  const {
    id,
    first_name,
    last_name,
    father_name,
    grandfather_name,
    sex,
    phone_number,
    birth_date,
    address,
  } = reqBody;
  // if no id : Create a new item
  if (!id) {
    try {
      const stmt = db.prepare(
        "INSERT INTO student (first_name, last_name, father_name,grandfather_name, sex, phone_number, birth_date, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      );
      const info = stmt.run(
        first_name,
        last_name,
        father_name,
        grandfather_name,
        sex,
        phone_number,
        birth_date,
        address
      );
      return { success: true, id: info.lastInsertRowid, info };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  } // if id : item exists So update it
  else {
    try {
      const values = Object.values(reqBody);

      const setClause = generateDBSetClause(reqBody);
      const stmt = db.prepare(`UPDATE student SET ${setClause} WHERE id = ?`);
      const info = stmt.run(...values, reqBody.id);
      return { success: true, id: info.lastInsertRowid, info };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
});
