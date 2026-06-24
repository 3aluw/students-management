import type {
  SupportedDateRanges,
  PlaygroundSettings,
  SchoolSeason,
} from "~/models/types";

import { calculateSeasonTermTimeRange } from "~/service/season";


 const calculateTypicalTimeRange = (range: SupportedDateRanges) => {
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

export const getTimeRange = (
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
    return calculateTypicalTimeRange(range);
  }
};

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