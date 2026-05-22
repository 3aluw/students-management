
import type { EventQueryFilters } from "~/data/types";
import { latenessService } from "~/server/services/latenessService";
import useDBUtils from "~/composables/useDBUtils";
const { logError, toSafeError } = useDBUtils();


export default defineEventHandler(async (event) => {
  const { buildWhereQuery } = useDBUtils();

  const query = getQuery<EventQueryFilters>(event); // time filter / class filter / offset  
  
  try {
      return latenessService.getLateness(query);
    }
    catch (err) {
      logError("Error fetching lateness:", err, event.path, query);
      
      const safeError = createError(toSafeError(err, "فشلت عملية إيجاد التأخرات"));
      return sendError(
        event, safeError
      );
    }
});
