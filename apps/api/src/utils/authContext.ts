import type { ActorRole } from "./roles";
import { isAllowedRole } from "./roles";

export type AuthSource = "supabase" | "local_prototype";

export type AuthenticatedActor = {
  actorId: string;
  actorEmail: string;
  actorRole: ActorRole;
  authSource: AuthSource;
};

// Supabase group name → role mapping (kept for reference and future Entra migration)
export const supabaseGroupRoleMappings: Array<{
  groupName: string;
  role: ActorRole;
}> = [
  { groupName: "Digaf-Governance-Admins", role: "governance_admin" },
  { groupName: "Digaf-Compliance-Officers", role: "compliance_officer" },
  { groupName: "Digaf-Governance-Checker2", role: "checker_2" },
  { groupName: "Digaf-Governance-Checker1", role: "checker_1" },
  { groupName: "Digaf-Governance-Makers", role: "maker" },
  { groupName: "Digaf-Governance-Viewers", role: "viewer" },
];

type LocalPrototypeActorInput = {
  actorId?: unknown;
  actorRole?: unknown;
};

// Local prototype only — used in development when SUPABASE_URL is not set.
// Production actor context must come from requireAuth middleware (JWT claims).
export function getLocalPrototypeActor(
  input: LocalPrototypeActorInput
): AuthenticatedActor | null {
  const actorId = typeof input.actorId === "string" ? input.actorId.trim() : "";
  const actorRole =
    typeof input.actorRole === "string" ? input.actorRole.trim() : "";

  if (!actorId || !isAllowedRole(actorRole)) {
    return null;
  }

  return {
    actorId,
    actorEmail: `${actorRole}@local.prototype`,
    actorRole,
    authSource: "local_prototype",
  };
}
