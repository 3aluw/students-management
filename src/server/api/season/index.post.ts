import type {
  EditSchoolSeason,
  NewSchoolSeason,
  NewSeasonPayload,
} from "~/data/types";
import db from "~/db/db";
import useDBUtils from "../../../composables/useDBUtils";
import { seasonRepo } from "~/server/repositories/seasonRepo";

export default defineEventHandler(async (event) => {
  const { generateDBSetClause } = useDBUtils();

  const reqBody = await readBody<EditSchoolSeason | NewSeasonPayload>(event);

  // if no id : Create a new item
  if (!("id" in reqBody)) {
    const { terminateCurrentSeason, newSeason, promoteStudents, repeaters } =
      reqBody;
    const stmt = db.prepare(
      "INSERT INTO class (grade, school_level,section) VALUES (?, ?, ?)",
    );
    const info = stmt.run(grade, school_level, section);
    return { success: true, id: info.lastInsertRowid, info };
  } // if id : item exists So update it
  else {
    seasonRepo.editSeason(reqBody);
  }
});
