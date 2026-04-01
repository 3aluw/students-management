import type { EventQueryFilters } from "~/data/types";

export default function () {
  const generateDBSetClause = <T extends Object>(object: T) => {
    // fields is an object like { name: 'Alice', age: 30, status: 'active' }
    const keys = Object.keys(object) as (keyof object)[];
    // Create "col1 = ?, col2 = ?, ..." for the SQL
    return keys.map((key) => `${key} = ?`).join(", ");
  };

  const generateDBInClause = (num: number) => Array(num).fill("?").join(",");

  const buildWhereQuery = <T extends EventQueryFilters>(
    queryObj: T,
    eventType: "absence" | "lateness",
  ) => {
    const clauses: string[] = [];
    const params: any[] = [];
    const defaultTableAbbr = eventType === "absence" ? "a." : "l.";
    for (const key of Object.keys(queryObj) as (keyof T)[]) {
      const value = queryObj[key];
      if (value === undefined) continue;
      if (key === "limit" || key === "offset") continue;

      if (key === "minDate") {
        clauses.push(`${defaultTableAbbr}date >= ?`);
        params.push(Number(value));
        continue;
      }
      if (key === "maxDate") {
        clauses.push(`${defaultTableAbbr}date <= ?`);
        params.push(Number(value));
        continue;
      }
      if (key === "classId") {
        clauses.push(`s.class_id = ?`);
        params.push(Number(value));
        continue;
      }
      if (key === "name") {
        clauses.push("first_name LIKE ? OR last_name LIKE ?");
        params.push(`%${value}%`, `%${value}%`);
        continue;
      }
      clauses.push(`${String(key)} = ?`);
      params.push(isNaN(Number(value)) ? value : Number(value));
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    return { where, params };
  };

  // ========== INTERNAL: takes an array and returns a SQL values list : (1),(2),... ==========
  const toSqlValuesList = (values: ([string, number] | number)[]) =>
    values.map((value) => `(${value})`).join(",");

  // ========== generates SQL values for a CTE while taking into account empty CTEs ==========
  const generateSqlCTEValues = (
    values: ([string, number] | number)[],
    columnsCount: number,
  ) => {
    if (values.length) return `${toSqlValuesList(values)}`;
    else {
      const nulls = Array(columnsCount).fill("NULL").join(", ");
      return `SELECT ${nulls} WHERE 0`;
    }
  };

  // ========== Handle multi steps workflow and its error handling ==========

  class StepError extends Error {
    constructor(
      public step: string,
      public originalError: any,
    ) {
      super(`Step failed: ${step}`, { cause: originalError });
    }
  }

  function runSteps(steps: { name: string; run: () => void }[]) {
    for (const step of steps) {
      try {
        step.run();
      } catch (err) {
        throw new StepError(step.name, err);
      }
    }
  }
  return {
    generateDBSetClause,
    generateDBInClause,
    buildWhereQuery,
    generateSqlCTEValues,
    runSteps,
  };
}
