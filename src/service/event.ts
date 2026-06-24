import type {
  LatenessInfo,
  AbsenceInfo,
} from "~/models/types";

// A function that return dates for lateness info or absence info
export const getDatesForEventInfo = <
  T extends
    | Pick<LatenessInfo, "late_by" | "start_time" | "date">
    | Pick<AbsenceInfo, "date" | "start_time">,
>(
  obj: T,
) => {
  const start_time = new Date(obj.date);
  start_time.setHours(0, 0, 0, 0);
  start_time.setMinutes(obj.start_time);
  // common base
  const base = {
    date: new Date(obj.date),
    start_time,
  };
  if ("late_by" in obj) {
    const late_by = new Date(start_time);
    late_by.setMinutes(late_by.getMinutes() + obj.late_by);
    return {
      ...base,
      late_by,
    };
  }
  return base;
};

