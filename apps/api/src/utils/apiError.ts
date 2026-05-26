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

export function sendServerError(
  res: Response,
  message: string,
  error?: unknown
) {
  return sendApiError(
    res,
    500,
    "SERVER_ERROR",
    message,
    error instanceof Error ? { message: error.message } : undefined
  );
}
