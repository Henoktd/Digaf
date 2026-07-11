import { describe, expect, it } from "vitest";
import { isAllowedRole, requireRole } from "./roles";

describe("isAllowedRole", () => {
  it("accepts every governance role", () => {
    for (const role of [
      "maker",
      "checker_1",
      "checker_2",
      "governance_admin",
      "compliance_officer",
      "viewer",
    ]) {
      expect(isAllowedRole(role)).toBe(true);
    }
  });

  it("rejects unknown or non-string values", () => {
    expect(isAllowedRole("admin")).toBe(false);
    expect(isAllowedRole("")).toBe(false);
    expect(isAllowedRole(null)).toBe(false);
    expect(isAllowedRole(undefined)).toBe(false);
    expect(isAllowedRole(42)).toBe(false);
  });
});

describe("requireRole", () => {
  it("authorizes a role in the allowed list", () => {
    const result = requireRole("governance_admin", ["governance_admin"]);
    expect(result).toEqual({ ok: true, role: "governance_admin" });
  });

  it("rejects a valid role that is not authorized for the action", () => {
    const result = requireRole("viewer", ["governance_admin"]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("not authorized");
  });

  it("rejects a missing role", () => {
    const result = requireRole(undefined, ["maker"]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe("actorRole is required");
  });

  it("rejects an unknown role string", () => {
    const result = requireRole("superuser", ["maker"]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("must be one of");
  });

  it("trims whitespace before checking", () => {
    const result = requireRole("  maker  ", ["maker"]);
    expect(result).toEqual({ ok: true, role: "maker" });
  });
});
