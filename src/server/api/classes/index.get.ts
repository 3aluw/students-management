import { classService } from "~/server/services/classService";

export default defineEventHandler((event) => {


    try {
        return classService.getClasses();
    } catch (error) {
        logError("Error fetching classes:", error, event.path, undefined);

        throw createError(toSafeError(error, "حدث خطأ أثناء جلب الأقسام"));
      
    }
});

