import type { TreeNode } from "primevue/treenode";
import { ArabicStudentProperties, ArabicClassProperties } from "~/data/static";
import type {
  Student,
  Class,
  SupportedDateRanges,
  LatenessInfo,
  AbsenceInfo,
  PlaygroundSettings,
  SchoolSeason,
  SchoolTerm,
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

  function minutesAfterMidnight(date: number | Date) {
    date = new Date(date);
    return date.getHours() * 60 + date.getMinutes();
  }
  const getDatesForPlaygroundSettings = (settings: PlaygroundSettings) => {
    const defaultStartTime = new Date();
    defaultStartTime.setHours(0, 0, 0, 0);
    defaultStartTime.setMinutes(settings.defaultStartTime);
    const defaultLateBy = new Date(defaultStartTime);
    defaultLateBy.setMinutes(
      defaultLateBy.getMinutes() + settings.defaultLateBy
    );
    return {
      defaultLateBy,
      defaultStartTime,
    };
  };
  // A function that return dates for lateness info or absence info
  const getDatesForEventInfo = <
    T extends
      | Pick<LatenessInfo, "late_by" | "start_time" | "date">
      | Pick<AbsenceInfo, "date" | "start_time">
  >(
    obj: T
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
  const formatDatesForTerm = (term: SchoolTerm) => {
    return {
      name: term.name,
      startDate: new Date(term.startDate),
      endDate: new Date(term.endDate),
    };
  };

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

  const mapSeasonsToTree = (seasons: SchoolSeason[]): TreeNode[] => {
    return seasons.map((season) => {
      const seasonDates = getSeasonStartAndEndDates(season);
      const now = Date.now();
      const seasonStatus =
        now < seasonDates.startDate
          ? "مستقبل"
          : now > seasonDates.endDate
          ? "منتهي"
          : "حالي";

      return {
        key: `season-${season.id}`,
        data: {
          id: season.id,
          name: season.name,
          status: seasonStatus,
          type: "season",
        },
        children: season.terms.map((term, index) => ({
          key: `term-${season.id}-${index}`,
          data: {
            name: term.name,
            startDate: term.startDate,
            endDate: term.endDate,
            type: "term",
          },
        })),
      };
    });
  };

  const getSeasonStartAndEndDates = (season: SchoolSeason) => {
    return {
      name: season.name,
      startDate: season.terms[0].startDate,
      endDate: season.terms[season.terms.length - 1].endDate,
    };
  };
  const getCollapsingSeasonIds = (seasons: SchoolSeason[]) => {
    const seasonDates = seasons.map(getSeasonStartAndEndDates);
    for (let i = 1; i < seasonDates.length; i++) {
      if (seasonDates[i].startDate < seasonDates[i - 1].endDate) {
        return [seasons[i - 1].id, seasons[i].id];
      }
    }
    return undefined;
  };
  return {
    getRequiredFieldMessage,
    getTimeRange,
    minutesAfterMidnight,
    getDatesForPlaygroundSettings,
    getDatesForEventInfo,
    formatDatesForTerm,
    normalizeResultBooleans,
    mapSeasonsToTree,
    getCollapsingSeasonIds,
  };
}
