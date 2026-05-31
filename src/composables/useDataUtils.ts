import { arabicProperties } from "~/data/static";
import type { ToastMessageOptions } from "primevue/toast"
import type { ZodError } from "zod";
import type { FetchError } from 'ofetch'
import type { H3Error } from "h3";
import type {
  SupportedDateRanges,
  LatenessInfo,
  AbsenceInfo,
  PlaygroundSettings,
  SchoolSeason,
  SchoolTerm,
  SeasonStatus,
  BackendValidationError,
} from "~/data/types";

export default function () {
  // ========== Fields / its Arabic translations functions ==========
  /*Internal */
  const formatRequiredFieldMessage = (
    arabicFieldName: string,
    type: "text" | "choice" = "text",
  ) =>
    type === "text"
      ? `يجب إدخال ${arabicFieldName}`
      : type == "choice"
        ? `يجب اختيار ${arabicFieldName}`
        : "هذا الحقل مطلوب";

  const getRequiredFieldMessage = (
    fieldName: string,
    type: "text" | "choice" = "text",
  ) => {
    const arabicPropertyName = getPropertyArabicName(fieldName)
    return arabicPropertyName
      ? formatRequiredFieldMessage(arabicPropertyName, type)
      : `يجب إدخال الحقل التالي: ${fieldName} `;
  };
  const getPropertyArabicName = (fieldName: string) => fieldName in arabicProperties ? arabicProperties[fieldName as keyof typeof arabicProperties] : undefined

  // ========== Time functions ==========
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
          now.getDate() - diff,
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
      defaultLateBy.getMinutes() + settings.defaultLateBy,
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
  const formatDatesForTerm = (term: Partial<SchoolTerm>) => {
    return {
      name: term.name,
      startDate: term.startDate ? new Date(term.startDate) : undefined,
      endDate: term.endDate ? new Date(term.endDate) : undefined,
    };
  };
  /* Convert dates back to timestamps */
const toTimestamp = (
  value: unknown,
  originalValue?: unknown
) => {
  const raw = originalValue ?? value;

  return raw instanceof Date
    ? raw.getTime()
    : value;
};

  //a function that transform 0/1 in DB results to real booleans
  const normalizeResultBooleans = <
    R extends Record<string, any>,
    K extends (keyof R)[],
  >(
    results: R[],
    keys: K,
  ) => {
    results.map((result) =>
      keys.forEach((key) => {
        result[key] = (result[key] === 1 ? "نعم" : "لا") as R[keyof R];
      }),
    );

    return results;
  };

  // ========== Season functions ==========
  const getSeasonStatus = (season: SchoolSeason): SeasonStatus => {
    const seasonDates = getSeasonStartAndEndDates(season);
    const now = Date.now();
    const seasonStatus: SeasonStatus =
      now < seasonDates.startDate
        ? "future"
        : now > seasonDates.endDate
          ? "past"
          : "current";
    return seasonStatus;
  };

  const mapSeasonsToTree = (seasons: SchoolSeason[]) => {
    if (seasons.length === 0) return [];
    return seasons.map((season) => {
      const seasonStatus = getSeasonStatus(season);
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
  const hasCollapsingTerms = (terms: SchoolTerm[]) =>
    terms.some((term, i, arr) => i > 0 && term.startDate < arr[i - 1].endDate);


  // ========== generates readable message from Zod issues array ==========
  const formatZodValidationError = (err: ZodError["issues"]) => {
    if (err.length === 1) {
      return err[0].message
    }
    // if there are at most 4 errors : log the first message and advise the user to check other fields
    else if (err.length < 4) {
      err.shift()
      const fields = err.map(errObj => (getPropertyArabicName(errObj.path[0] as string) ?? errObj.path[0])).join(' ، ')
      return err[0].message + ` \n كما يجب التحقق من : ${fields}`
    }
    // if there are more than 4 errors :  advise the user to check fields by name
    else {
      const fields = err.map(errObj => (getPropertyArabicName(errObj.path[0] as string) ?? errObj.path[0])).join(' ، ')
      return ` يجب التحقق من : ${fields}`
    }
  }

  const isFetchError = (err: unknown): err is FetchError<H3Error> => {
    return (err as FetchError)?.data !== undefined
  }
  const isZodApiError = (error: any): error is BackendValidationError =>
    error &&
    typeof error === 'object' &&
    error.statusCode === 400 &&
    Array.isArray(error.data?.issues)

  // ========== Other functions ==========
  // geenrates an obkect for useToast based on the error passed
  const getToastErrorObject = (error: unknown, summary: string): ToastMessageOptions => {
    let detail = '';

    if (isFetchError(error)) {
      const err = error.data;

      if (isZodApiError(err)) {
        detail = `${err.message}: ${formatZodValidationError(err.data.issues)}`;
      } else if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof err.message === 'string'
      ) {
        detail = err.message;
      }
    }

    return {
      severity: 'error',
      summary,
      detail,
      life: 3000,
    }
  }

  return {
    getPropertyArabicName,
    getRequiredFieldMessage,
    getTimeRange,
    minutesAfterMidnight,
    getDatesForPlaygroundSettings,
    getDatesForEventInfo,
    formatDatesForTerm,
    toTimestamp,
    normalizeResultBooleans,
    getSeasonStatus,
    mapSeasonsToTree,
    getSeasonStartAndEndDates,
    getCollapsingSeasonIds,
    hasCollapsingTerms,
    getToastErrorObject
  };
}
