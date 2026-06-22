import type {
    Option,
    SchoolSeason,
    SchoolTerm,
    SeasonStatus,
    SupportedDateRanges,
} from "~/data/types";

// ========== Season functions ==========
// ========== WARNING: Some functions (getSeasonStatus-getSeasonStartAndEndDates) are used by server; So this files has to be pure JS and free from browsser APIs / Vue reactive peorperties like refs... ==========
export const getSeasonStatus = (season: SchoolSeason): SeasonStatus => {
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

export const getTermStatus = (term: SchoolTerm): SeasonStatus => {
    const now = Date.now();
    const seasonStatus: SeasonStatus =
        now < term.startDate
            ? "future"
            : now > term.endDate
                ? "past"
                : "current";
    return seasonStatus;
}

export const getSeasonStartAndEndDates = (season: SchoolSeason) => {
    return {
        id: season.id,
        name: season.name,
        startDate: season.terms[0].startDate,
        endDate: season.terms[season.terms.length - 1].endDate,
    };
};
export const getCollapsingSeasonIds = (seasons: SchoolSeason[]) => {
    const seasonDates = seasons.map(getSeasonStartAndEndDates);
    for (let i = 0; i < seasonDates.length - 1; i++) {
        const current = seasonDates[i];
        const past = seasonDates[i + 1];  //sicne season are ordered DESC; the next item in the array is the previous season

        if (current.startDate < past.endDate) {
            return [current.id, past.id];
        }
    }
    return undefined;
};
export const hasCollapsingTerms = (terms: SchoolTerm[]) =>
    terms.some((term, i, arr) => i > 0 && term.startDate < arr[i - 1].endDate);

export const mapSeasonsToTree = (seasons: SchoolSeason[]) => {
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

const sortTerms = (terms: SchoolTerm[], sortType: "asc" | "desc" = "asc") => {
    const sorted = [...terms].sort((a, b) => a.endDate - b.endDate)
    return sortType == "asc" ? sorted : sorted.reverse()
}

const seasonTimeRanges = ["this season", "last term", "this term", "last season"] as const satisfies readonly SupportedDateRanges[]
type SeasonTermTimeRange = typeof seasonTimeRanges[number];

/**
 * Extracts the current/past seasons and terms from a list of school seasons.
 * @param seasons - Array of school seasons to analyze.
 * @returns An object containing the current season, current term, past term, and last season.
 * @remarks
 * Uses `getSeasonStatus` and `getTermStatus` to determine "current" vs "past" status.
 * Returns `undefined` for any value that doesn't exist (e.g., no current season).
 * @internal - Used internally by other filter helper functions.
 */
const getCurrentAndPastSeasonsTerms = (seasons: SchoolSeason[]) => {
    const currentSeason = seasons.find((season) => getSeasonStatus(season) == "current")
    const terms = seasons.flatMap((season) => season.terms)
    const currentTerm = terms.find((term) => getTermStatus(term) === "current")
    const pastTerm = sortTerms(terms,"desc").find((term) => getTermStatus(term) === "past")
    const lastSeason = seasons.find((season) => getSeasonStatus(season) == "past")
    return { currentSeason, currentTerm, pastTerm, lastSeason }
}

/**
 * Creates a boolean map indicating which season/term time ranges are available.
 * @param seasons - Array of school seasons to check against.
 * @returns A record mapping each `seasonTimeRange` to a boolean indicating availability.
 * @example
 * ```typescript
 * getSeasonTermAvailabilityMap(seasons);
 * // Returns: { "this season": true, "this term": false, "last term": true, "last season": false }
 * ```
 */
const getAvailableFiltersMap = (seasons: SchoolSeason[]) => {
    const { currentSeason, currentTerm, pastTerm, lastSeason } = getCurrentAndPastSeasonsTerms(seasons)

    const availableFilters
        = {
            "this season": Boolean(currentSeason),
            "this term": Boolean(currentTerm),
            "last term": Boolean(pastTerm),
            "last season": Boolean(lastSeason),
        } satisfies Record<SeasonTermTimeRange, boolean>;
    return availableFilters
}

/**
 * Filters season/term filter options to only those currently available.
 * @param seasonFilterOptions - Array of option objects with `value` of type `seasonTimeRange`.
 * @param seasons - Array of school seasons to check availability against.
 * @returns Filtered array containing only the options that are currently available.
 * @remarks
 * Uses `getAvailableFiltersMap` internally to determine availability.
 * @example
 * ```typescript
 * const options = [
 *   { value: "this season", label: "This Season" },
 *   { value: "last term", label: "Last Term" }
 * ];
 * getAvailableSeasonFilterOptions(options, seasons);
 * // Returns only options where the time range is available
 * ```
 */
export const getAvailableSeasonFilterOptions = (seasonFilterOptions: Option<SeasonTermTimeRange>[], seasons: SchoolSeason[]): Option<SupportedDateRanges>[] => {
    const optionConditionMap = getAvailableFiltersMap(seasons)

    const availableOptions = seasonFilterOptions.filter(({ value }) => optionConditionMap[value])
    return availableOptions
}

/**
 * Gets the start and end dates for a specified season or term time range.
 * @param range - The time range to calculate dates for ("this season", "this term", "last term", or "last season").
 * @param seasons - Array of school seasons to extract date ranges from.
 * @returns A tuple `[startDate, endDate]` as Date objects.
 * @throws {Error} If the range is not a valid season/term time range.
 * @throws {Error} If the required season or term doesn't exist (e.g., no current season when requesting "this season").
 * @remarks
 * - Uses `getSeasonStartAndEndDates` for season ranges.
 * - Uses direct `startDate`/`endDate` properties for term ranges.
 * @example
 * ```typescript
 * const [start, end] = getSeasonTermTimeRange("this term", seasons);
 * console.log(`Term runs from ${start} to ${end}`);
 * ```
 */
export const getSeasonTermTimeRange = (range: SeasonTermTimeRange, seasons: SchoolSeason[]) => {

    if (!seasonTimeRanges.includes(range)) throw new Error("This function accepts only season/term calculations ");

    const { currentSeason, currentTerm, pastTerm, lastSeason } = getCurrentAndPastSeasonsTerms(seasons)

    let start, end;
    switch (range) {
        case "this season": {
            if (!currentSeason) throw new Error("Thre is no current season")
            const formattedSeason = getSeasonStartAndEndDates(currentSeason)
            start = formattedSeason.startDate;
            end = formattedSeason.endDate;
            break;
        }

        case "this term": {
            if (!currentTerm) throw new Error("Thre is no current term")
            start = currentTerm.startDate;
            end = currentTerm.endDate;
            break;
        }
        case "last term": {
            if (!pastTerm) throw new Error("Thre is no current term")
            start = pastTerm.startDate;
            end = pastTerm.endDate;
            break;
        }
        case "last season": {
            if (!lastSeason) throw new Error("Thre is no past season")
            const formattedSeason = getSeasonStartAndEndDates(lastSeason)
            start = formattedSeason.startDate;
            end = formattedSeason.endDate;
            break;
        }

        default:
            throw new Error("Unknown range");
    }

    return [start, end];
};