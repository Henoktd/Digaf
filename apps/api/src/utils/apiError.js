"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBadRequest = sendBadRequest;
exports.sendNotFound = sendNotFound;
exports.sendConflict = sendConflict;
exports.sendForbidden = sendForbidden;
exports.sendServerError = sendServerError;
function sendApiError(res, status, code, message, details) {
    return res.status(status).json({
        error: {
            code,
            message,
            ...(details === undefined ? {} : { details }),
        },
    });
}
function sendBadRequest(res, message, details) {
    return sendApiError(res, 400, "BAD_REQUEST", message, details);
}
function sendNotFound(res, message, details) {
    return sendApiError(res, 404, "NOT_FOUND", message, details);
}
function sendConflict(res, message, details) {
    return sendApiError(res, 409, "CONFLICT", message, details);
}
function sendForbidden(res, message, details) {
    return sendApiError(res, 403, "FORBIDDEN", message, details);
}
function sendServerError(res, message, error) {
    return sendApiError(res, 500, "SERVER_ERROR", message, error instanceof Error ? { message: error.message } : undefined);
}
//# sourceMappingURL=apiError.js.map