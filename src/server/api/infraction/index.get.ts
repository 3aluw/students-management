import type { EventQueryFilters } from "~/models/types";
import { infractionService } from "~/server/services/infractionService";

export default defineEventHandler(async (event) => {
  const query = getQuery<EventQueryFilters>(event); // time filter / class filter / offset

  try {
    return infractionService.getInfraction(query);
  } catch (err) {
    logError("Error fetching lateness:", err, event.path, query);

    throw createError(toSafeError(err, "فشلت عملية إيجاد المخالفات"));
  }
});
