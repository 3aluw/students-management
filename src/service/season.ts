import type {
    Option,
    SchoolSeason,
    SchoolTerm,
    SeasonStatus,
    SupportedDateRanges,
} from "~/models/types";

// ========== Season functions ==========
// ========== WARNING: Some functions (getSeasonStatus-getSeasonStartAndEndDates) are used by server; So this files has to be pure JS and free from browsser APIs / Vue reactive peorperties like refs... ==========
/**
 * Determines the current status of a school season relative to now.
 * @param season - The school season to check.
 * @returns The season status: "future", "current", or "past".
 * @remarks
 * Uses the season's start and end dates (derived from its first and last terms).
 */
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

/**
 * Determines the current status of a school term relative to now.
 * @param term - The school term to check.
 * @returns The term status: "future", "current", or "past".
 * ```
 */
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
/**
 * Gets the date range (start/end) for a season based on its terms.
 * @param season - The school season containing an array of terms.
 * @returns An object with:
 * - `id`: The season ID.
 * - `name`: The season name.
 * - `startDate`: The start date of the first term.
 * - `endDate`: The end date of the last term.
 * @remarks
 * Assumes terms are ordered and the season spans from the first term's start to the last term's end.
 */
export const getSeasonStartAndEndDates = (season: SchoolSeason) => {
    return {
        id: season.id,
        name: season.name,
        startDate: season.terms[0].startDate,
        endDate: season.terms[season.terms.length - 1].endDate,
    };
};

/**
 * Finds the first pair of overlapping seasons in a list.
 * @param seasons - Array of school seasons (expected to be ordered descending by date).
 * @returns A tuple `[currentSeasonId, pastSeasonId]` of the first overlapping pair, or `undefined` if none overlap.
 * @remarks
 * Seasons are expected to be in descending order (newest first).
 * Checks if each season's start date overlaps with the previous season's end date.
 * ```
 */
export const findOverlappingSeasonIds = (seasons: SchoolSeason[]) => {
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
/**
 * Checks if any terms in a list overlap with the previous term.
 * @param terms - Array of school terms (expected to be ordered by date).
 * @returns `true` if any term starts before the previous term ends, `false` otherwise.
 * @remarks
 * A term overlaps if `term.startDate < previousTerm.endDate`.
 * Terms are assumed to be ordered chronologically.
 */
export const hasOverlappingTerms = (terms: SchoolTerm[]) =>
    terms.some((term, i, arr) => i > 0 && term.startDate < arr[i - 1].endDate);

/**
 * Builds a tree structure for tree table UI components from seasons and their terms.
 * @param seasons - Array of school seasons to map.
 * @returns An array of tree nodes where each season is a parent node with term children.

 */
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

/**
 * Sorts a list of terms by their end dates.
 * @param terms - Array of school terms to sort.
 * @param sortType - Sort order: "asc" for oldest first, "desc" for newest first. Defaults to "asc".
 * @returns A new sorted array of terms (does not mutate the original).
 */
const sortTerms = (terms: SchoolTerm[], sortType: "asc" | "desc" = "asc") => {
    const sorted = [...terms].sort((a, b) => a.endDate - b.endDate)
    return sortType == "asc" ? sorted : sorted.reverse()
}

/*=========================  seasons Time ranges calculation  ======================== */
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
export const calculateSeasonTermTimeRange = (range: SeasonTermTimeRange, seasons: SchoolSeason[]) => {

    if (!seasonTimeRanges.includes(range)) throw new Error("This function accepts only season/term calculations ");

    const { currentSeason, currentTerm, pastTerm, lastSeason } = getCurrentAndPastSeasonsTerms(seasons)

    let start, end;
    switch (range) {
        case "this season": {
            if (!currentSeason) throw new Error("There is no current season")
            const formattedSeason = getSeasonStartAndEndDates(currentSeason)
            start = formattedSeason.startDate;
            end = formattedSeason.endDate;
            break;
        }

        case "this term": {
            if (!currentTerm) throw new Error("There is no current term")
            start = currentTerm.startDate;
            end = currentTerm.endDate;
            break;
        }
        case "last term": {
            if (!pastTerm) throw new Error("There is no current term")
            start = pastTerm.startDate;
            end = pastTerm.endDate;
            break;
        }
        case "last season": {
            if (!lastSeason) throw new Error("There is no past season")
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