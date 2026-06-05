import type { EventQueryFilters } from "~/data/types";
import { absenceService } from "~/server/services/absenceService";


export default defineEventHandler(async (event) => {

  const query = getQuery<EventQueryFilters>(event); // time filter / class filter / offset

  try {
    return absenceService.getAbsences(query);
  }
  catch (err) {
    logError("Error fetching absences:", err, event.path, query);

    throw createError(toSafeError(err, "فشلت عملية إيجاد الغيابات"));

  }
});
