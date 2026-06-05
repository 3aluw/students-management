import { getPropertyArabicName } from "~/utils/arabic-properties"
import type { ZodError } from "zod";
import type { FetchError } from 'ofetch'
import type { H3Error } from "h3";
import type { ToastMessageOptions } from "primevue/toast"
import type {
    BackendValidationError,
} from "~/data/types";

// ========== Zod Error formatting ==========
// keep one error per path
const getUniqueZodIssues = (issues: ZodError["issues"]) => {
    const seen = new Set();

    const uniqueIssues = issues.filter(issue => {
        const key = issue.path[0];

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
    return uniqueIssues
}
//generates readable message from Zod issues array
const formatZodValidationError = (issues: ZodError["issues"]) => {
    const uniqueIssues = getUniqueZodIssues(issues)
    if (uniqueIssues.length === 1) {
        return uniqueIssues[0].message
    }
    // if there are at most 4 errors : log the first message and advise the user to check other fields
    else if (uniqueIssues.length < 4) {
        uniqueIssues.shift()
        const fields = uniqueIssues.filter(errObj => (getPropertyArabicName(errObj.path[0] as string)))
        return uniqueIssues[0].message + (fields.length ? ` \n كما يجب التحقق من : ${fields.join(' ، ')}` : "\n كما يرجى التحقق من المعلومات الأخرى المدخلة   ")
    }
    // if there are more than 4 errors :  advise the user to check fields by name
    else {
        const fields = uniqueIssues.filter(errObj => (getPropertyArabicName(errObj.path[0] as string)))
        return fields.length ? ` يجب التحقق من : ${fields.join(' ، ')}` : "يرجى التحقق من المعلومات المدخلة"
    }
}

const isFetchError = (err: unknown): err is FetchError<H3Error> => {
    return (err as FetchError)?.data !== undefined
}
const isZodApiError = (error: any): error is BackendValidationError =>
    error &&
    typeof error === 'object' &&
    error.statusCode === 400 &&
    Array.isArray(error.data?.issues)

// ========== Other functions ==========
// geenrates an object for useToast based on the error passed
export const getToastErrorObject = (error: unknown, summary: string): ToastMessageOptions => {
    let detail = '';

    if (isFetchError(error)) {
        const err = error.data;

        if (isZodApiError(err)) {
            detail = `${err.message}: ${formatZodValidationError(err.data.issues)}`;
        } else if (
            err &&
            typeof err === 'object' &&
            'message' in err &&
            typeof err.message === 'string'
        ) {
            detail = err.message;
        }
    }
    return {
        severity: 'error',
        summary,
        detail,
        life: 7000,
    }
}