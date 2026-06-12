import type { H3Error } from "h3";

// ========== Logs the error ==========
export const logError = (message: string, error: unknown, path: string, body: unknown) => {
    console.error({
        message,
        error,
        path,
        body,
    });
}

// ========== Formats the error ==========
export const toSafeError = (
    error: unknown,
    defaultMessage = "حدث خطأ أثناء العملية",
    defaultStatusMessage = "Bad Request "
) => {
    const fallback = {
        statusCode: 500,
        message: defaultMessage,
        statusMessage: defaultStatusMessage,
    };

    if (typeof error !== "object" || error === null) {
        return fallback;
    }

    const err = error as Partial<H3Error> & Record<string, unknown>;

    const statusCode =
        typeof err.statusCode === "number" ? err.statusCode : 500;

    const message =
        typeof err.message === "string"
            ? err.message
            : defaultMessage;

    // Try to extract any existing status message variants
    const statusMessage =
        typeof err.statusMessage === "string"
            ? err.statusMessage
            : statusCode === 400
                ? "Bad Request"
                : statusCode === 401
                    ? "Unauthorized"
                    : statusCode === 403
                        ? "Forbidden"
                        : statusCode === 404
                            ? "Not Found"
                            : statusCode >= 500
                                ? "Internal Server Error"
                                : "Error";

    return {
        statusCode,
        message,
        statusMessage,
    };
};