import type { ActorRole } from "./roles";
import { isAllowedRole } from "./roles";

type AuthSource = "local_prototype" | "entra";

export type AuthenticatedActor = {
  actorId: string;
  actorRole: ActorRole;
  authSource: AuthSource;
  groups: string[];
};

type LocalPrototypeActorInput = {
  actorId?: unknown;
  actorRole?: unknown;
};

const entraGroupRoleMappings: Array<{
  groupName: string;
  role: ActorRole;
}> = [
  {
    groupName: "Digaf-Governance-Admins",
    role: "governance_admin",
  },
  {
    groupName: "Digaf-Compliance-Officers",
    role: "compliance_officer",
  },
  {
    groupName: "Digaf-Governance-Checker2",
    role: "checker_2",
  },
  {
    groupName: "Digaf-Governance-Checker1",
    role: "checker_1",
  },
  {
    groupName: "Digaf-Governance-Makers",
    role: "maker",
  },
  {
    groupName: "Digaf-Governance-Viewers",
    role: "viewer",
  },
];

// Local prototype only. Production actor context must come from trusted
// authenticated identity claims, not from client-controlled request bodies.
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
    actorRole,
    authSource: "local_prototype",
    groups: [],
  };
}

export function mapEntraGroupsToRole(groups: string[]): ActorRole {
  const normalizedGroups = new Set(groups.map((group) => group.trim()));

  for (const mapping of entraGroupRoleMappings) {
    if (normalizedGroups.has(mapping.groupName)) {
      return mapping.role;
    }
  }

  return "viewer";
}
