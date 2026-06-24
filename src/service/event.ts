import type {
  LatenessInfo,
  AbsenceInfo,
} from "~/models/types";

/**
 * Parses raw event data into Date objects for display and calculation.
 * @typeParam T - The event type, either LatenessInfo (with `late_by`) or AbsenceInfo (without `late_by`).
 * @param obj - The raw event data object containing date and time information.
 * @returns An object containing:
 * - `date`: A Date object representing the event date (at midnight).
 * - `start_time`: A Date object representing the event start time (date + minutes).
 * - `late_by`: (Optional, lateness only) A Date object representing the late arrival time.
 * @remarks
 * - `start_time` is constructed by taking the event date and adding the `start_time` minutes.
 * - `late_by` (if present) is `start_time` plus the `late_by` minutes.
 * - This function uses type narrowing (`"late_by" in obj`) to determine if the event is lateness.
 */
export const parseEventTimeInfo = <
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

