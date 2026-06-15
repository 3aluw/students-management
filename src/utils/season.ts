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



const seasonTimeRanges = ["this season", "last term", "this term", "last season"] as const satisfies readonly SupportedDateRanges[]
type seasonTimeRange = typeof seasonTimeRanges[number];

const getFiltersData = (seasons: SchoolSeason[]) => {
    const currentSeason = seasons.find((season) => getSeasonStatus(season) == "current")
    const terms = seasons.flatMap((season) => season.terms)
    const currentTerm = terms.find((term) => getTermStatus(term) === "current")
    const pastTerm = terms.find((term) => getTermStatus(term) === "past")
    const lastSeason = seasons.find((season) => getSeasonStatus(season) == "past")
    return { currentSeason, currentTerm, pastTerm, lastSeason }
}

const getAvailableFiltersMap = (seasons: SchoolSeason[]) => {
    const { currentSeason, currentTerm, pastTerm, lastSeason } = getFiltersData(seasons)

    const availableFilters
        = {
            "this season": Boolean(currentSeason),
            "this term": Boolean(currentTerm),
            "last term": Boolean(pastTerm),
            "last season": Boolean(lastSeason),
        } satisfies Record<seasonTimeRange, boolean>;
    return availableFilters
}

export const getAvailableSeasonFilterOptions = (seasonFilterOptions: Option<seasonTimeRange>[], seasons: SchoolSeason[]): Option<SupportedDateRanges>[] => {
    const optionConditionMap = getAvailableFiltersMap(seasons)

    const availableOptions = seasonFilterOptions.filter(({ value }) => optionConditionMap[value])
    return availableOptions
}


export const getSeasonTermTimeRange = (range: seasonTimeRange, seasons: SchoolSeason[]) => {

    if (!seasonTimeRanges.includes(range)) throw new Error("This function accepts only season/term calculations ");

    const { currentSeason, currentTerm, pastTerm, lastSeason } = getFiltersData(seasons)

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