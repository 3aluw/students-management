import type { ToastMessageOptions } from "primevue";
import { ZodError } from "zod";
import type { $ZodIssue } from "zod/v4/core";
import type { XLSXStudent } from "~/models/types";
/**
 *  @type type guard
 * @summary If the argument has an array of issues -it is a zod error-
 */
export const isZodValidationError = (error: any): error is ZodError =>
  error && typeof error === "object" && Array.isArray(error.issues);

/**
 * Represents validation errors grouped by field name for XLSX student imports.
 * @property rows - Array of row numbers (1-indexed, including header) where errors occurred.
 * @property messages - Array of error messages for this field.
 * @example
 * ```typescript
 * {
 *   first_name: { rows: [2, 4, 5], messages: ["يجب إدخال الاسم"] },
 *   last_name: { rows: [3], messages: ["الاسم طويل جداً"] }
 * }
 * ```
 */
type XLSXStudentIssuesByFieldName = {
  [key in keyof Partial<XLSXStudent>]: { rows: number[]; messages: string[] };
};

/**
 * Groups Zod validation issues by field name for XLSX student imports.
 * @param issues - Array of Zod issues from validation.
 * @returns An object mapping each field to its error rows and messages.
 * @remarks
 * - Extracts row number from `err.path[0]` (0-indexed) and adds 2 to convert to Excel row numbers (including header).
 * - Extracts field name from `err.path[1]`.
 * - Converts Sets to sorted arrays for serialization.
 * @example
 * ```typescript
 * const issues = zodError.issues;
 * const grouped = groupZodIssuesByField(issues);
 * // Returns: { first_name: { rows: [2, 4], messages: ["ضروري"] } }
 * ```
 */
function groupIssuesByField(issues: $ZodIssue[]) {
  const result: {
    [key in keyof Partial<XLSXStudent>]: {
      rows: Set<number>;
      messages: Set<string>;
    };
  } = {};

  for (const err of issues) {
    const row = err.path[0] as number;
    const field = err.path[1] as keyof XLSXStudent;

    if (!result[field]) {
      result[field] = {
        rows: new Set(),
        messages: new Set(),
      };
    }
    result[field].rows.add(row + 2);
    result[field].messages.add(err.message);
  }
  // convert Sets → arrays for serialization
  const output: XLSXStudentIssuesByFieldName = {};

  for (const [field, data] of Object.entries(result)) {
    output[field as keyof XLSXStudent] = {
      rows: [...data.rows].sort((a, b) => a - b),
      messages: [...data.messages],
    };
  }
  return output;
}

/**
 * Formats grouped field errors into human-readable detail strings.
 * @param fieldErrors - The grouped field errors object from `groupZodIssuesByField`.
 * @returns An array of formatted detail strings, one per field.
 * @remarks
 * Uses `getPropertyArabicName` to translate field names to Arabic.
 * @example
 * ```typescript
 * const details = formatFieldErrorsAsDetails(groupedErrors);
 * // Returns: ["الاسم: الصفوف: 2 / 4 الأخطاء: يجب إدخال الاسم" , ...]
 * ```
 */
const formatFieldErrorsAsDetails = (
  IssuesByFieldName: XLSXStudentIssuesByFieldName,
) =>
  Object.entries(IssuesByFieldName).map(([key, value]) => {
    const getKeyArabicName = getPropertyArabicName(key) ?? key;
    return `${getKeyArabicName}:
    الصفوف : ${value.rows.join(" / ")}
     الأخطاء: ${value.messages.join(" \n ")}
    `;
  });

/**
 * Converts formatted validation details into a Toast UI object.
 * @param detailsArrays - Array of detail strings from `formatFieldErrorsAsDetails`.
 * @param summary - The toast title/summary message.
 * @returns A ToastMessageOptions object ready for use with the toast system.
 * @remarks
 * Joins multiple details with double newlines for visual separation.
 * @example
 * ```typescript
 * const toast = formatFieldErrorsAsToast(details, "خطأ في البيانات");
 * toastService.add(toast);
 * ```
 */
const validationDetailsToToastObject = (
  detailsArrays: string[],
  summary: string,
): ToastMessageOptions => {
  const details = detailsArrays.join(" \n \n");
  return { severity: "warn", summary, detail: details };
};

/**
 * Coordination function that transforms Zod validation issues directly into a Toast UI object.
 * @param issues - Array of Zod issues from validation.
 * @param errorTitle - The title/summary for the toast message.
 * @returns A ToastMessageOptions object ready to display validation errors.
 * @remarks
 * This is a convenience function that chains:
 * 1. `groupZodIssuesByField` - groups errors by field
 * 2. `formatFieldErrorsAsDetails` - formats as human-readable text
 * 3. `formatFieldErrorsAsToast` - converts to Toast object
 * @example
 * ```typescript
 * try {
 *   validateData(data);
 * } catch (error) {
 *   if (isZodValidationError(error)) {
 *     const toast = zodIssuesToToastMessage(error.issues, "فشل التحقق من البيانات");
 *     toast.add(toast);
 *   }
 * }
 * ```
 */
export const zodIssuesToToastMessage = (
  issues: $ZodIssue[],
  errorTitle: string,
) => {
  const formattedError = groupIssuesByField(issues);
  const ValidationDetails = formatFieldErrorsAsDetails(formattedError);
  const ToastObject = validationDetailsToToastObject(
    ValidationDetails,
    errorTitle,
  );
  return ToastObject;
};
