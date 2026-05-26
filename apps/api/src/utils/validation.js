"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireString = requireString;
exports.requireNonEmptyString = requireNonEmptyString;
exports.requireUuid = requireUuid;
exports.normalizeActorId = normalizeActorId;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function requireString(value, fieldName) {
    if (typeof value !== "string") {
        throw new Error(`${fieldName} must be a string`);
    }
    return value;
}
function requireNonEmptyString(value, fieldName) {
    const stringValue = requireString(value, fieldName).trim();
    if (!stringValue) {
        throw new Error(`${fieldName} is required`);
    }
    return stringValue;
}
function requireUuid(value, fieldName) {
    const stringValue = requireNonEmptyString(value, fieldName);
    if (!uuidRegex.test(stringValue)) {
        throw new Error(`${fieldName} must be a valid UUID`);
    }
    return stringValue;
}
function normalizeActorId(value) {
    return requireNonEmptyString(value, "actorId");
}
//# sourceMappingURL=validation.js.map