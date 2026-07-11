import { describe, expect, it } from "vitest";
import {
  requireNonEmptyString,
  requireString,
  requireUuid,
} from "./validation";

describe("requireString", () => {
  it("returns the string unchanged", () => {
    expect(requireString("hello", "field")).toBe("hello");
  });

  it("throws for non-strings", () => {
    expect(() => requireString(42, "field")).toThrow("field must be a string");
    expect(() => requireString(null, "field")).toThrow("field must be a string");
  });
});

describe("requireNonEmptyString", () => {
  it("trims and returns the value", () => {
    expect(requireNonEmptyString("  abc  ", "field")).toBe("abc");
  });

  it("throws for empty or whitespace-only strings", () => {
    expect(() => requireNonEmptyString("", "field")).toThrow("field is required");
    expect(() => requireNonEmptyString("   ", "field")).toThrow("field is required");
  });
});

describe("requireUuid", () => {
  it("accepts a valid v4 UUID", () => {
    expect(requireUuid("6f1e0a4e-2b7c-4d0e-9a3b-1c2d3e4f5a6b", "id")).toBe(
      "6f1e0a4e-2b7c-4d0e-9a3b-1c2d3e4f5a6b"
    );
  });

  it("accepts uppercase UUIDs", () => {
    expect(requireUuid("6F1E0A4E-2B7C-4D0E-9A3B-1C2D3E4F5A6B", "id")).toBe(
      "6F1E0A4E-2B7C-4D0E-9A3B-1C2D3E4F5A6B"
    );
  });

  it("rejects malformed values", () => {
    expect(() => requireUuid("not-a-uuid", "id")).toThrow("id must be a valid UUID");
    expect(() => requireUuid("6f1e0a4e2b7c4d0e9a3b1c2d3e4f5a6b", "id")).toThrow(
      "id must be a valid UUID"
    );
    expect(() => requireUuid("", "id")).toThrow("id is required");
  });

  it("rejects SQL-injection-shaped input", () => {
    expect(() =>
      requireUuid("6f1e0a4e-2b7c-4d0e-9a3b-1c2d3e4f5a6b'; DROP TABLE shareholder;--", "id")
    ).toThrow("id must be a valid UUID");
  });
});
