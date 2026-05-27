import type { BackendResponse, EventQueryFilters } from "~/data/types";
import type { H3Error } from "h3";
import type { ZodError } from "zod";

const { getPropertyArabicName } = useDataUtils() 
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
  // ========== Logs the error (used in backend routes) ==========
  const logError = (message: string, error: unknown, path: string, body: unknown) => {
    console.error({
      message,
      error,
      path,
      body,
    });
  }

  const toSafeError = (
    error: unknown,
    defaultMessage = "حدث خطأ أثناء العملية"
  ) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      "message" in error
    ) {
      const h3Error = error as H3Error;

      return {
        statusCode: h3Error.statusCode,
        message: h3Error.message,
      };
    }

    return {
      statusCode: 500,
      message: defaultMessage,
    };
  };
  // ========== Handle multi steps workflow and its error handling ==========
  /**
   * Represents a step in a multi-step workflow, including its name, the function to run, and an optional condition for execution.
   */
  type Step = {
    name: string;
    run: () => void;
    when?: () => boolean;
  };
  /**
   * Represents the result of a workflow step, including its name, status, and any error that occurred.
   */
  type StepResult = {
    name: string;
    status: "ran" | "skipped" | "failed";
    error?: unknown;
  };

  /**
   * Custom error class for handling errors in multi-step workflows, containing details about the failed step and all previous steps
   */
  class StepError extends Error {
    constructor(
      public step: string,
      public originalError: unknown,
      public stepResults: StepResult[],
    ) {
      super(`فشلت الخطوة: ${step}`, { cause: originalError });
    }
  }
  /**
   * handles multi-step workflows and their error handling.
   * @param steps - The steps to run.
   * @param eager - Whether to throw at the first error.
   * @throws StepError containing details about the failed step and all previous steps' results.
   */
  function runSteps(steps: Step[], eager: boolean = true) {
    const stepResults: StepResult[] = [];
    for (const step of steps) {
      if (step.when && !step.when()) {
        stepResults.push({ name: step.name, status: "skipped" });
        continue;
      }
      try {
        step.run();
        stepResults.push({ name: step.name, status: "ran" });
      } catch (err) {
        console.log(err);
        stepResults.push({ name: step.name, status: "failed", error: err });
        if (eager) throw new StepError(step.name, err, stepResults);
      }
    }
  }
  return {
    formatZodValidationError,
    generateDBSetClause,
    generateDBInClause,
    buildWhereQuery,
    generateSqlCTEValues,
    logError,
    toSafeError,
    runSteps,
    StepError,
  };
}
