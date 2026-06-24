import type {
  SupportedDateRanges,
  PlaygroundSettings,
  SchoolSeason,
} from "~/models/types";

import { calculateSeasonTermTimeRange } from "~/service/season";

/**
 * Calculates the start and end timestamps for standard (non-season/term) date ranges.
 * @param range - The date range type ("today", "yesterday", "this week", or "this month").
 * @returns A tuple `[startTimestamp, endTimestamp]` in milliseconds since Unix epoch.
 * @throws {Error} If the range is unknown.
 * @example
 * ```typescript
 * const [start, end] = calculateStandardDateRange("today");
 * console.log(new Date(start), new Date(end));
 * ```
 */
 const calculateStandardTimeRange = (range: SupportedDateRanges) => {
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

      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
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
/**
 * Gets the date range (start/end timestamps) for a given filter option.
 * @param range - The requested date range type (standard or season/term-based).
 * @param seasons - Array of school seasons (required for season/term calculations).
 * @returns A tuple `[startTimestamp, endTimestamp]` in milliseconds since Unix epoch.
 * @throws {Error} If the range is a season/term type but the required season/term doesn't exist.
 * @remarks
 * Routes to either:
 * - `calculateSeasonTermTimeRange` for season/term-based ranges
 * - `calculateStandardDateRange` for standard calendar ranges
 * @example
 * ```typescript
 * const [start, end] = getDateRangeForFilter("this week", seasons);
 * const [seasonStart, seasonEnd] = getDateRangeForFilter("this season", seasons);
 * ```
 */
export const getDateRangeForFilter = (
  range: SupportedDateRanges,
  seasons: SchoolSeason[],
) => {
  const seasonTimeRanges = [
    "this season",
    "last term",
    "this term",
    "last season",
  ] as const satisfies readonly SupportedDateRanges[];
  type seasonTimeRange = (typeof seasonTimeRanges)[number];
  if (seasonTimeRanges.includes(range as seasonTimeRange))
    return calculateSeasonTermTimeRange(range as seasonTimeRange, seasons);
  else {
    return calculateStandardTimeRange(range);
  }
};

/**
 * Calculates the default start time and late-by threshold based on playground settings.
 * @param settings - The playground configuration containing default start time and late tolerance.
 * @returns An object with:
 * - `defaultStartTime`: The calculated default start time for the day.
 * - `defaultLateBy`: The calculated late threshold time.
 * @remarks
 * - `defaultStartTime` is set to the start of the current day (00:00:00.000) plus `settings.defaultStartTime` minutes.
 * - `defaultLateBy` is `defaultStartTime` plus `settings.defaultLateBy` minutes.
 * @example
 * ```typescript
 * const settings = { defaultStartTime: 480, defaultLateBy: 15 }; // 8:00 AM, 15 min grace
 * const { defaultStartTime, defaultLateBy } = calculatePlaygroundTimeBoundaries(settings);
 * console.log("Start:", defaultStartTime.toTimeString()); // "08:00:00"
 * console.log("Late by:", defaultLateBy.toTimeString()); // "08:15:00"
 * ```
 */
export const getDatesForPlaygroundSettings = (settings: PlaygroundSettings) => {
  const defaultStartTime = new Date();
  defaultStartTime.setHours(0, 0, 0, 0);
  defaultStartTime.setMinutes(settings.defaultStartTime);
  const defaultLateBy = new Date(defaultStartTime);
  defaultLateBy.setMinutes(defaultLateBy.getMinutes() + settings.defaultLateBy);
  return {
    defaultLateBy,
    defaultStartTime,
  };
};