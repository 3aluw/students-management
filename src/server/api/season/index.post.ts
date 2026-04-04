import type { EditSchoolSeason, NewSeasonPayload } from "~/data/types";
import { seasonService } from "~/server/services/seasonService";

export default defineEventHandler(async (event) => {

  const reqBody = await readBody<EditSchoolSeason | NewSeasonPayload>(event);

  // if no id : Create a new item
  if (!("id" in reqBody)) {
    try {
      return seasonService.runNewSeasonWorkflow(reqBody);
    } catch (error: any) {
      return {
        success: false,
        step: error?.step || "غير محدد",
        message:
          error?.message || "حدث خطأ غير متوقع أثناء إنشاء الموسم الجديد",
      };
    }
  } // if id : item exists So update it
  else {
    return seasonService.editSeason(reqBody);
  }
});
