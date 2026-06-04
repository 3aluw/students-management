import { classService } from "~/server/services/classService";
import useDBUtils from "~/composables/useDBUtils";

export default defineEventHandler((event) => {
const { logError,toSafeError } = useDBUtils();

    try {
        return classService.getClasses();
    } catch (error) {
        logError("Error fetching classes:", error, event.path, undefined);

        throw createError(toSafeError(error, "حدث خطأ أثناء جلب الأقسام"));
      
    }
});

