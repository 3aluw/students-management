import { seasonService } from "~/server/services/seasonService";

export default defineEventHandler(() => {
return seasonService.getSeasons();
});
