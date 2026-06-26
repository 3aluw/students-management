import type { EventQueryFilters, StudentsQueryFilters } from "~/models/types";
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
export const generateDBInClause = (num: number) =>
  Array(num).fill("?").join(",");

/* -------------------------------------------------------------------------- */
/*                             WHERE/ Pagination utils                        */
/* -------------------------------------------------------------------------- */

/*  TERMINOLOGY
Filters: (The raw user input object).

Parameter / Param:  (The intermediate, normalized key-value pairs).

Clause: (The final SQL string and execution values). 
*/

type QueryType =
  | "absence"
  | "student"
  | "lateness"
  | "infraction"
  | "pagination";
type PureEventQueryFilters = Omit<EventQueryFilters, "limit" | "offset">;
type PaginationQueryFilters = Pick<EventQueryFilters, "limit" | "offset">;
type QueryMap = {
  student: StudentsQueryFilters;
  absence: PureEventQueryFilters;
  lateness: PureEventQueryFilters;
  infraction: PureEventQueryFilters;
  pagination: PaginationQueryFilters;
};

// Represents a blueprint for an abstract piece of a SQL query (WHERE item, LIMIT, etc.)
interface SQLFragment {
  key: string; // The key originating from the filter/pagination object
  sqlExpression?: string; // The raw SQL fragment chunk (e.g., "exited_at >= ?")
  bindingValue: unknown; // The parameterized execution value
}

/**
 * Transforms raw filter or pagination entries into structured SQL fragments.
 */
const expandFilterToSQLFragments = (
  key: string,
  value: unknown,
  context: QueryType,
): SQLFragment[] => {
  if (context == "student") {
    // Edge Case: Handle Year Boundaries
    if (key === "exited_at_Year" && Number(value)) {
      const boundaries = getYearBoundaries(Number(value) as number);
      return [
        {
          key: "exited_at_Year",
          sqlExpression: "exited_at >= ?",
          bindingValue: boundaries.start,
        },
        {
          key: "exited_at_Year",
          sqlExpression: "exited_at <= ?",
          bindingValue: boundaries.end,
        },
      ];
    }
  } else if (context == "pagination") {
    const sqlKeyword = key.toUpperCase();
    return [
      {
        key,
        sqlExpression: `${sqlKeyword} ?`,
        bindingValue: Number(value),
      },
    ];
  } else {
    const defaultTableAbbr = context === "absence" ? "a." : context === "lateness" ? "l." : "i.";
    if (key === "minDate") {
      return [
        {
          key,
          sqlExpression: `${defaultTableAbbr}date >= ?`,
          bindingValue: Number(value),
        },
      ];
    }
    if (key === "maxDate") {
      return [
        {
          key,
          sqlExpression: `${defaultTableAbbr}date <= ?`,
          bindingValue: Number(value),
        },
      ];
    }
    if (key === "classId") {
      return [
        {
          key,
          sqlExpression: `s.class_id = ?`,
          bindingValue: Number(value),
        },
      ];
    }
  }
  // Edge Case -Common between tables-: Full Name Search
  if (key === "name") {
    return [
      {
        key: "name",
        sqlExpression: "(first_name || ' ' || last_name) LIKE ?",
        bindingValue: `%${value}%`,
      },
    ];
  }
  // Default Case: Simple exact match
  return [{ key, bindingValue: value }];
};

/**
 * Loops through the filter/pagination object and aggregates all SQL SQLFragment.
 */
const extractSQLFragments = <T extends QueryType>(
  context: T,
  filters: QueryMap[T],
): SQLFragment[] => {
  const fragments: SQLFragment[] = [];

  const entries = Object.entries(filters) as [string, unknown][];

  for (const [key, value] of entries) {
    if (value !== undefined) {
      // Guard against undefined values
      fragments.push(...expandFilterToSQLFragments(key, value, context));
    }
  }

  return fragments;
};

/**
 * Compiles parsed fragments into executable statements and their binding values.
 */
const compileSQLClause = (
  fragments: SQLFragment[],
  context: QueryType,
): { stmt: string; bindings: unknown[] } => {
  if (!fragments.length) {
    return { stmt: "", bindings: [] };
  }

  // Fallback to "key = ?" if no special SQL expression was defined
  const clauses = fragments.map((p) => p.sqlExpression ?? `${p.key} = ?`);
  const bindings = fragments.map((p) => p.bindingValue);

  if (context === "pagination") {
    return {
      stmt: `${clauses.join(" ")}`,
      bindings,
    };
  }

  // Where filters are joined by AND, defaulting to standard equality if no custom expression is present
  return {
    stmt: `WHERE ${clauses.join(" AND ")}`,
    bindings,
  };
};

/**
 * Main coordinator function to build SQL chunks from client-side inputs.
 */
export const buildSQLClause = <T extends QueryType>(
  context: T,
  sourceData: QueryMap[T],
) => {
  const fragments = extractSQLFragments(context, sourceData);
  return compileSQLClause(fragments, context);
};

/* -------------------------------------------------------------------------- */
/*                                CTE & value lists                           */
/* -------------------------------------------------------------------------- */
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
 */ export const generateSqlCTEValues = (
  values: ([string, number] | number)[],
  columnsCount: number,
) => {
  if (values.length) return `${toSqlValuesList(values)}`;
  else {
    const nulls = Array(columnsCount).fill("NULL").join(", ");
    return `SELECT ${nulls} WHERE 0`;
  }
};
