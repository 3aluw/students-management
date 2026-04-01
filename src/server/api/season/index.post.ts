import type {
  EditSchoolSeason,
  NewSchoolSeason,
  NewSeasonPayload,
} from "~/data/types";
import db from "~/db/db";
import useDBUtils from "../../../composables/useDBUtils";
import { seasonRepo } from "~/server/repositories/seasonRepo";
import { seasonService } from "~/server/services/seasonService";
export default defineEventHandler(async (event) => {
  const { generateDBSetClause } = useDBUtils();

  const reqBody = await readBody<EditSchoolSeason | NewSeasonPayload>(event);

  // if no id : Create a new item
  if (!("id" in reqBody)) {
    seasonService.runNewSeasonWorkflow(reqBody);
  } // if id : item exists So update it
  else {
    seasonRepo.editSeason(reqBody);
  }
});
