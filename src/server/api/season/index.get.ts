import db from "~/db/db";
import type { SchoolSeason } from "~/data/types";
import { seasonService } from "~/server/services/seasonService";

export default defineEventHandler(() => {
return seasonService.getSeasons();
});
