import { ZodError } from "zod";
import type { $ZodIssue } from "zod/v4/core";
import type { XLSXStudent } from "~/data/types";

export const isZodValidationError = (error: any): error is ZodError =>
  error && typeof error === "object" && Array.isArray(error.issues);

type XLSXStudentIssuesByFieldName = {
  [key in keyof Partial<XLSXStudent>]: { rows: number[]; messages: string[] };
};

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

    result[field].rows.add((row + 2));
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

const getValidationDetails = (
  IssuesByFieldName: XLSXStudentIssuesByFieldName,
) =>
  Object.entries(IssuesByFieldName).map(([key, value]) => {
    const getKeyArabicName = getPropertyArabicName(key) ?? key;
    return `${getKeyArabicName}:
    الصفوف : ${value.rows.join(" / ")}
     الأخطاء: ${value.messages.join(" \n ")}
    `;
  });

const validationDetailsToToastObject = (
  detailsArrays: string[],
  summary: string,
) => {
  const details = detailsArrays.join(" \n \n");
  return { severity: "error", summary, detail: details };
};

export const fromIssuesToToastObject = (
  issues: $ZodIssue[],
  errorTitle: string,
) => {
  const formattedError = groupIssuesByField(issues);
  const ValidationDetails = getValidationDetails(formattedError);
  const ToastObject = validationDetailsToToastObject(
    ValidationDetails,
    errorTitle,
  );
  return ToastObject;
};
