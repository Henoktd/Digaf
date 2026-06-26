import type { Response } from "express";

function sendApiError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  return res.status(status).json({
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  });
}

export function sendBadRequest(
  res: Response,
  message: string,
  details?: unknown
) {
  return sendApiError(res, 400, "BAD_REQUEST", message, details);
}

export function sendNotFound(
  res: Response,
  message: string,
  details?: unknown
) {
  return sendApiError(res, 404, "NOT_FOUND", message, details);
}

export function sendConflict(
  res: Response,
  message: string,
  details?: unknown
) {
  return sendApiError(res, 409, "CONFLICT", message, details);
}

export function sendForbidden(
  res: Response,
  message: string,
  details?: unknown
) {
  return sendApiError(res, 403, "FORBIDDEN", message, details);
}

function extractErrorDetails(error: unknown): { message: string } | undefined {
  if (error instanceof Error) {
    return { message: error.message };
  }

  // Supabase/Postgrest errors are plain objects shaped like
  // { message, code, details, hint } — not Error instances — so the
  // `instanceof Error` check above silently drops them.
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    const e = error as { message: string; code?: string; details?: string; hint?: string };
    return {
      message: [e.message, e.details, e.hint].filter(Boolean).join(" — "),
    };
  }

  return undefined;
}

export function sendServerError(
  res: Response,
  message: string,
  error?: unknown
) {
  if (error !== undefined) {
    console.error(`[SERVER_ERROR] ${message}:`, error);
  }
  return sendApiError(res, 500, "SERVER_ERROR", message, extractErrorDetails(error));
}
