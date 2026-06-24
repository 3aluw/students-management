
import type { EventQueryFilters } from "~/models/types";
import { latenessService } from "~/server/services/latenessService";


export default defineEventHandler(async (event) => {

  const query = getQuery<EventQueryFilters>(event); // time filter / class filter / offset  
  
  try {
      return latenessService.getLateness(query);
    }
    catch (err) {
      logError("Error fetching lateness:", err, event.path, query);
      
      throw createError(toSafeError(err, "فشلت عملية إيجاد التأخرات"));
 
    }
});
