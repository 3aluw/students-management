import { ArabicStudentProperties, ArabicClassProperties } from "~/data/static";
import type {
  Student,
  Class,
  SupportedDateRanges,
  LatenessInfo,
} from "~/data/types";

export default function () {
  const formatRequiredFieldMessage = (
    arabicText: string,
    type: "text" | "choice" = "text"
  ) =>
    type === "text"
      ? `يجب إدخال ${arabicText}`
      : type == "choice"
      ? `يجب اختيار ${arabicText}`
      : "هذا الحقل مطلوب";

  const getRequiredFieldMessage = (
    fieldName: keyof typeof ArabicStudentProperties | keyof Class,
    type: "text" | "choice" = "text"
  ) => {
    return fieldName in ArabicStudentProperties
      ? formatRequiredFieldMessage(
          ArabicStudentProperties[fieldName as keyof Student],
          type
        )
      : fieldName in ArabicClassProperties
      ? formatRequiredFieldMessage(
          ArabicClassProperties[fieldName as keyof Class],
          type
        )
      : "هذا الحقل مطلوب";
  };
  const getTimeRange = (range: SupportedDateRanges) => {
    const now = new Date();
    let start, end;

    switch (range) {
      case "today": {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
        break;
      }

      case "yesterday": {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
        break;
      }

      case "this week": {
        const weekday = now.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat

        // Distance from current day back to Friday
        // If today is Friday (5), diff = 0
        const diff = (weekday - 5 + 7) % 7;

        start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - diff
        );
        start.setHours(0, 0, 0, 0);

        // End is Thursday 23:59:59.999
        end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
        break;
      }

      case "this month": {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        end = new Date(end.getTime() - 1);
        break;
      }

      default:
        throw new Error("Unknown range");
    }

    return [start.getTime(), end.getTime()];
  };
  // A function that calculates the start_time and late_by Date objects for lateness
  const getDateForLateness = (
    obj: Pick<LatenessInfo, "late_by" | "start_time">
  ) => {
    const { late_by: lBy, start_time: sTime } = obj;
    const start_time = new Date();
    start_time.setHours(0, sTime, 0, 0); // hour = 0, minutes = x

    const late_by = new Date(start_time);
    late_by.setMinutes(late_by.getMinutes() + lBy);
    return {start_time, late_by}
  };
  const getMinutesDifference = (start: Date, end: Date) => {
  }
  //a function that transform 0/1 in DB results to real booleans
  const normalizeResultBooleans = <
    R extends Record<string, any>,
    K extends (keyof R)[]
  >(
    results: R[],
    keys: K
  ) => {
    results.map((result) =>
      keys.forEach((key) => {
        result[key] = (result[key] === 1 ? "نعم" : "لا") as R[keyof R];
      })
    );

    return results;
  };
  return {
    getRequiredFieldMessage,
    getTimeRange,
    getDateForLateness,
    normalizeResultBooleans,
  };
}
