const allowedActorRoles = [
  "maker",
  "checker_1",
  "checker_2",
  "governance_admin",
  "compliance_officer",
  "viewer",
] as const;

export type ActorRole = (typeof allowedActorRoles)[number];

export function isAllowedRole(role: unknown): role is ActorRole {
  return (
    typeof role === "string" &&
    allowedActorRoles.includes(role as ActorRole)
  );
}

export function requireRole(
  role: unknown,
  allowedRoles: ActorRole[]
):
  | { ok: true; role: ActorRole }
  | { ok: false; message: string } {
  const normalizedRole = typeof role === "string" ? role.trim() : "";

  if (!normalizedRole) {
    return {
      ok: false,
      message: "actorRole is required",
    };
  }

  if (!isAllowedRole(normalizedRole)) {
    return {
      ok: false,
      message:
        "actorRole must be one of: maker, checker_1, checker_2, governance_admin, compliance_officer, viewer",
    };
  }

  if (!allowedRoles.includes(normalizedRole)) {
    return {
      ok: false,
      message: `actorRole '${normalizedRole}' is not authorized for this action`,
    };
  }

  return {
    ok: true,
    role: normalizedRole,
  };
}
