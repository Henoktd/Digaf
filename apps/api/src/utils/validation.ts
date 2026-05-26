const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireString(value: unknown, fieldName: string) {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string`);
  }

  return value;
}

export function requireNonEmptyString(value: unknown, fieldName: string) {
  const stringValue = requireString(value, fieldName).trim();

  if (!stringValue) {
    throw new Error(`${fieldName} is required`);
  }

  return stringValue;
}

export function requireUuid(value: unknown, fieldName: string) {
  const stringValue = requireNonEmptyString(value, fieldName);

  if (!uuidRegex.test(stringValue)) {
    throw new Error(`${fieldName} must be a valid UUID`);
  }

  return stringValue;
}

export function normalizeActorId(value: unknown) {
  return requireNonEmptyString(value, "actorId");
}
