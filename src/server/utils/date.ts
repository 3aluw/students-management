export const getYearBoundaries = (time: number) => {
    const date = new Date(time);
    const year = date.getFullYear();

    const start = new Date(year, 0, 1, 0, 0, 0, 0).getTime();
    const end = new Date(year, 11, 31, 23, 59, 59, 999).getTime();

    return { start, end };
};