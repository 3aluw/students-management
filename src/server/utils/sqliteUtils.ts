import type { EventQueryFilters, StudentsQueryFilters } from "~/data/types";
import { getYearBoundaries } from "./date";



/**
 * Generates a SQL SET clause for UPDATE statements from an object's keys.
 * @typeParam T - The object type to extract keys from.
 * @param object - The object whose keys will become column names.
 * @returns A comma-separated string like "col1 = ?, col2 = ?".
 * @example
 * ```typescript
 * generateDBSetClause({ name: 'Alice', age: 30 }) // returns "name = ?, age = ?"
 * ```
 */
export const generateDBSetClause = <T extends Object>(object: T) => {
    const keys = Object.keys(object) as (keyof object)[];
    return keys.map((key) => `${key} = ?`).join(", ");
};

/**
 * Generates a SQL IN clause with the specified number of placeholders.
 * @param num - Number of placeholders to generate.
 * @returns A comma-separated string of question marks.
 * @example
 * ```typescript
 * generateDBInClause(3) // returns "?,?,?" //to be used  like : IN(?,?,?)
 * ```
 */
export const generateDBInClause = (num: number) => Array(num).fill("?").join(",");

/* -------------------------------------------------------------------------- */
/*                                WHERE utils                                 */
/* -------------------------------------------------------------------------- */

/*  TERMINOLOGY
Filters: (The raw user input object).

Parameter / Param:  (The intermediate, normalized key-value pairs).

Clause: (The final SQL string and execution values). 
*/

type TableToQuery = 'absence' | 'student' | 'lateness'
type PureEventQueryFilters = Omit<EventQueryFilters, "limit" | "offset">
type QueryMap = {
    student: StudentsQueryFilters;
    absence: PureEventQueryFilters;
    lateness: PureEventQueryFilters;
}
// "SQLPWherearam" makes it clear this represents a specific column/query blueprint.
interface SQLPWherearam {
    columnName: string; // Renamed from 'name' to distinguish it from the student's name
    sqlExpression?: string;  // Renamed from 'query' to avoid confusion with the whole SQL query
    bindingValue: unknown;   // Renamed from 'value' for database clarity
}

/**
 * Maps a raw filter key/value pair into one or more SQL parameters.
 * Handles complex transformations like date boundaries or multi-column searches.
 */
const expandFilterToSQLParams = (columnName: string, value: unknown, table: TableToQuery): SQLPWherearam[] => {

    if (table == "student") {
        // Edge Case: Handle Year Boundaries
        if (columnName === "exited_at_Year" && Number(value)) {
            const boundaries = getYearBoundaries(Number(value) as number);
            return [
                { columnName: "exited_at_Year", sqlExpression: "exited_at >= ?", bindingValue: boundaries.start },
                { columnName: "exited_at_Year", sqlExpression: "exited_at <= ?", bindingValue: boundaries.end }
            ];
        }

    }
    else {
        const defaultTableAbbr = table === "absence" ? "a." : "l.";
        if (columnName === 'minDate') {
            return [{
                columnName,
                sqlExpression: `${defaultTableAbbr}date >= ?`,
                bindingValue: Number(value)

            }]
        }
        if (columnName === 'maxDate') {
            return [{
                columnName,
                sqlExpression: `${defaultTableAbbr}date <= ?`,
                bindingValue: Number(value)

            }]
        }
        if (columnName === 'classId') {
            return [{
                columnName,
                sqlExpression: `s.class_id = ?`,
                bindingValue: Number(value)
            }]
        }
    }
    // Edge Case -Common between tables-: Full Name Search
    if (columnName === "name") {
        return [{
            columnName: "name",
            sqlExpression: "(first_name || ' ' || last_name) LIKE ?",
            bindingValue: `%${value}%`
        }];
    }
    // Default Case: Simple exact match
    return [{ columnName, bindingValue: value }];
};

/**
 * Flattens the raw filter object into a single array of SQL parameters.
 */
const parseFiltersToSQLParams = <T extends TableToQuery>(table: T, filters: QueryMap[T]): SQLPWherearam[] => {
    const sqlParams: SQLPWherearam[] = [];

    const filterEntries = Object.entries(filters) as [string, unknown][];

    for (const [key, value] of filterEntries) {
        if (value !== undefined) { // Guard against undefined values
            sqlParams.push(...expandFilterToSQLParams(key, value, table));
        }
    }

    return sqlParams;
};

/**
 * Combines SQL parameters into the final WHERE string and bindings (values) for better-sqlite3.
 */
const compileWhereClause = (params: SQLPWherearam[]): { whereStmt: string, bindings: unknown[] } => {
    if (!params.length) {
        return { whereStmt: "", bindings: [] };
    }

    // Fallback to "columnName = ?" if no special SQL expression was defined
    const clauses = params.map(p => p.sqlExpression ?? `${p.columnName} = ?`);
    const bindings = params.map(p => p.bindingValue);

    return {
        whereStmt: `WHERE ${clauses.join(" AND ")}`, // Added "WHERE " prefix for convenience
        bindings
    };
};
// A coordinator function keeping -transforms query into SQL params then into string/values-
export const buildWhereFromFilters = <T extends TableToQuery>(table: T, filters: QueryMap[T],) => {
    const params = parseFiltersToSQLParams(table, filters);
    return compileWhereClause(params);
};

/**
 * Converts an array of values into a SQL VALUES list format.
 * @param values - Array of values to wrap in parentheses.
 * @returns A comma-separated string of parenthesized values.
 * @internal
 */
const toSqlValuesList = (values: ([string, number] | number)[]) =>
    values.map((value) => `(${value})`).join(",");

/**
 * Generates SQL VALUES for a CTE, handling empty arrays gracefully.
 * @param values - Array of values to convert to SQL VALUES format.
 * @param columnsCount - Number of columns to fill.
 * @returns A VALUES list string, or a dummy SELECT that returns no rows if values is empty.
 * @example
 * ```typescript
 * generateSqlCTEValues([[1, 2], [3, 4]], 2) // returns "(1,2),(3,4)"
 * ```
 */export const generateSqlCTEValues = (
        values: ([string, number] | number)[],
        columnsCount: number,
    ) => {
    if (values.length) return `${toSqlValuesList(values)}`;
    else {
        const nulls = Array(columnsCount).fill("NULL").join(", ");
        return `SELECT ${nulls} WHERE 0`;
    }
};
