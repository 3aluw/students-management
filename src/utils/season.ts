import type {
    SchoolSeason,
    SchoolTerm,
    SeasonStatus,
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